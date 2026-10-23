import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

function computeSha256(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function validateArtifacts() {
  console.log('[Artifact Validator] Beginning clean-environment validation of release artifacts...');
  const distDir = path.resolve(process.cwd(), 'dist');
  const releaseDir = path.resolve(distDir, 'release-artifacts');
  const cleanEnvDir = path.resolve(distDir, 'clean-env-validation');

  if (!fs.existsSync(releaseDir)) {
    console.error('[Artifact Validator] Error: release-artifacts directory not found. Run npm run build:platforms first.');
    process.exit(1);
  }

  // 1. Verify SHA256SUMS.txt
  const shaFile = path.join(releaseDir, 'SHA256SUMS.txt');
  if (!fs.existsSync(shaFile)) {
    console.error('[Artifact Validator] Error: SHA256SUMS.txt missing.');
    process.exit(1);
  }

  const shaLines = fs.readFileSync(shaFile, 'utf8').trim().split('\n');
  console.log(`[Artifact Validator] Validating ${shaLines.length} artifacts against SHA256SUMS.txt...`);

  for (const line of shaLines) {
    if (!line.trim()) continue;
    const [expectedHash, filename] = line.trim().split(/\s+/);
    const filePath = path.join(releaseDir, filename);

    if (!fs.existsSync(filePath)) {
      console.error(`[Artifact Validator] Missing artifact file: ${filename}`);
      process.exit(1);
    }

    const actualHash = computeSha256(filePath);
    if (actualHash !== expectedHash) {
      console.error(`[Artifact Validator] Checksum mismatch for ${filename}! Expected: ${expectedHash}, Actual: ${actualHash}`);
      process.exit(1);
    }
    console.log(`  ✓ Checksum verified: ${filename}`);
  }

  // 2. Verify RELEASE_MANIFEST.json
  const manifestFile = path.join(releaseDir, 'RELEASE_MANIFEST.json');
  if (!fs.existsSync(manifestFile)) {
    console.error('[Artifact Validator] Error: RELEASE_MANIFEST.json missing.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  if (!manifest.artifacts || manifest.artifacts.length !== 6) {
    console.error(`[Artifact Validator] Expected 6 artifacts in manifest, found ${manifest.artifacts?.length}`);
    process.exit(1);
  }
  console.log(`[Artifact Validator] Release manifest schema verified: ${manifest.project} v${manifest.version}`);

  // 3. Clean-environment extraction & structure validation
  if (fs.existsSync(cleanEnvDir)) {
    fs.rmSync(cleanEnvDir, { recursive: true, force: true });
  }
  fs.mkdirSync(cleanEnvDir, { recursive: true });

  const requiredFilePatterns = [
    {
      target: 'web',
      archive: manifest.artifacts.find((a) => a.target === 'web').filename,
      mustContain: ['index.html', 'manifest.json', 'sw.js', 'README.txt'],
    },
    {
      target: 'windows-x64',
      archive: manifest.artifacts.find((a) => a.target === 'windows-x64').filename,
      mustContain: ['index.html', 'launcher.bat', 'run.vbs', 'app.manifest'],
    },
    {
      target: 'linux-x64',
      archive: manifest.artifacts.find((a) => a.target === 'linux-x64').filename,
      mustContain: ['index.html', 'run-linux.sh', 'mythos-astra.desktop'],
    },
    {
      target: 'macos-universal',
      archive: manifest.artifacts.find((a) => a.target === 'macos-universal').filename,
      mustContain: ['MythosAstra.app/Contents/MacOS/launch-macos.sh', 'MythosAstra.app/Contents/Info.plist'],
    },
    {
      target: 'android',
      archive: manifest.artifacts.find((a) => a.target === 'android').filename,
      mustContain: ['AndroidManifest.xml', 'assets/www/index.html', 'INSTALL_INSTRUCTIONS.txt'],
    },
    {
      target: 'ios',
      archive: manifest.artifacts.find((a) => a.target === 'ios').filename,
      mustContain: ['MythosAstra.xcarchive/Info.plist', 'MythosAstra.xcarchive/Products/Applications/MythosAstra.app/www/index.html'],
    },
  ];

  for (const check of requiredFilePatterns) {
    const archivePath = path.join(releaseDir, check.archive);
    const targetExtractDir = path.join(cleanEnvDir, check.target);
    fs.mkdirSync(targetExtractDir, { recursive: true });

    try {
      execSync(`tar -xf "${archivePath}" -C "${targetExtractDir}"`, { stdio: 'pipe' });
    } catch (err) {
      console.error(`[Artifact Validator] Failed to unpack ${check.archive}:`, err.message);
      process.exit(1);
    }

    for (const reqFile of check.mustContain) {
      const fullReqPath = path.join(targetExtractDir, reqFile);
      if (!fs.existsSync(fullReqPath)) {
        console.error(`[Artifact Validator] Missing required deliverable file in ${check.archive}: ${reqFile}`);
        process.exit(1);
      }
    }

    console.log(`  ✓ Package validated in clean env: ${check.target} (${check.mustContain.length} key files verified)`);
  }

  // Cleanup cleanEnvDir
  fs.rmSync(cleanEnvDir, { recursive: true, force: true });

  console.log('[Artifact Validator] SUCCESS: All 6 platform artifacts verified with 100% integrity!');
}

validateArtifacts();
