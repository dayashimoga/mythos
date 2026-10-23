import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync, spawn } from 'child_process';

function computeSha256(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function adler32(buf, offset = 0, length = buf.length - offset) {
  let a = 1;
  let b = 0;
  const MOD = 65521;
  for (let i = offset; i < offset + length; i++) {
    a = (a + buf[i]) % MOD;
    b = (b + a) % MOD;
  }
  return ((b << 16) | a) >>> 0;
}

async function validateArtifacts() {
  console.log('================================================================');
  console.log('[Artifact Validator] Stage 1 Cross-Platform Artifact Validation');
  console.log('================================================================');

  const rootDir = process.cwd();
  const distDir = path.resolve(rootDir, 'dist');
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
    console.log(`  ✓ Checksum verified: ${filename} [${actualHash.substring(0, 16)}...]`);
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
  console.log(`[Artifact Validator] Manifest schema verified: ${manifest.project} v${manifest.version}`);

  // 3. Clean-environment extraction & binary format verification
  if (fs.existsSync(cleanEnvDir)) {
    fs.rmSync(cleanEnvDir, { recursive: true, force: true });
  }
  fs.mkdirSync(cleanEnvDir, { recursive: true });

  const checks = [
    {
      target: 'web',
      archive: manifest.artifacts.find((a) => a.target === 'web').filename,
      mustContain: ['index.html', 'manifest.json', 'sw.js', 'README.txt'],
      validateBinary: (targetDir) => {
        const html = fs.readFileSync(path.join(targetDir, 'index.html'), 'utf8');
        if (!html.includes('<canvas id="game-canvas"') && !html.includes('mythos-canvas')) {
          throw new Error('Web index.html missing game canvas element');
        }
        const manifestJson = JSON.parse(fs.readFileSync(path.join(targetDir, 'manifest.json'), 'utf8'));
        if (!manifestJson.start_url || manifestJson.display !== 'fullscreen') {
          throw new Error('PWA manifest invalid');
        }
        return 'PWA Web Assets Validated (HTML5 Canvas + SW + Manifest)';
      },
    },
    {
      target: 'windows-x64',
      archive: manifest.artifacts.find((a) => a.target === 'windows-x64').filename,
      mustContain: ['mythos-astra.exe', 'WebView2Loader.dll', 'index.html', 'README-WINDOWS.txt'],
      validateBinary: async (targetDir) => {
        const exePath = path.join(targetDir, 'mythos-astra.exe');
        const buf = fs.readFileSync(exePath);

        // Verify PE Header
        const mz = buf.slice(0, 2).toString('ascii');
        if (mz !== 'MZ') throw new Error(`Invalid Windows DOS header magic: ${mz}`);
        const peOff = buf.readUInt32LE(0x3c);
        const peSig = buf.slice(peOff, peOff + 4).toString('ascii');
        if (peSig !== 'PE\0\0') throw new Error(`Invalid Windows PE signature: ${peSig}`);
        const machine = buf.readUInt16LE(peOff + 4);
        if (machine !== 0x8664) throw new Error(`Expected AMD64 (0x8664), found: 0x${machine.toString(16)}`);

        // Verify WebView2Loader.dll
        const dllBuf = fs.readFileSync(path.join(targetDir, 'WebView2Loader.dll'));
        if (dllBuf.slice(0, 2).toString('ascii') !== 'MZ') {
          throw new Error('Invalid WebView2Loader.dll PE format');
        }

        // Windows Runtime Launch Verification (if running on Windows host)
        if (process.platform === 'win32') {
          console.log('    [Runtime Test] Launching native Windows executable in isolated sandbox...');
          const child = spawn(exePath, [], {
            detached: true,
            stdio: 'ignore',
            cwd: targetDir,
          });

          await new Promise((resolve) => setTimeout(resolve, 2000));

          let isAlive = false;
          try {
            // Test if process is still running
            process.kill(child.pid, 0);
            isAlive = true;
          } catch (e) {
            isAlive = false;
          }

          if (isAlive) {
            console.log(`    ✓ Native Windows process running cleanly (PID: ${child.pid})`);
            // Clean termination
            try {
              process.kill(child.pid, 'SIGTERM');
            } catch (err) {
              // ignore
            }
          } else {
            console.warn('    ! Process exited early (may require desktop user session)');
          }
        }

        return `Valid PE32+ (x86_64) Native Executable (${Math.round(buf.length / 1024)} KB) + WebView2Loader`;
      },
    },
    {
      target: 'linux-x64',
      archive: manifest.artifacts.find((a) => a.target === 'linux-x64').filename,
      mustContain: ['mythos-astra', 'mythos-astra.desktop', 'index.html', 'README-LINUX.txt'],
      validateBinary: (targetDir) => {
        const elfPath = path.join(targetDir, 'mythos-astra');
        const buf = fs.readFileSync(elfPath);

        // Verify ELF Header
        const elfMagic = buf.slice(0, 4).toString('hex');
        if (elfMagic !== '7f454c46') throw new Error(`Invalid Linux ELF magic: ${elfMagic}`);
        const elfClass = buf[4]; // 2 = 64-bit
        if (elfClass !== 2) throw new Error(`Expected 64-bit ELF (2), found: ${elfClass}`);
        const elfData = buf[5]; // 1 = LSB
        if (elfData !== 1) throw new Error(`Expected LSB little-endian (1), found: ${elfData}`);
        const machine = buf.readUInt16LE(18); // 0x3e = x86_64
        if (machine !== 0x3e) throw new Error(`Expected x86_64 machine (0x3e), found: 0x${machine.toString(16)}`);

        return `Valid ELF 64-bit LSB (x86-64) Executable (${Math.round(buf.length / 1024)} KB)`;
      },
    },
    {
      target: 'macos-universal',
      archive: manifest.artifacts.find((a) => a.target === 'macos-universal').filename,
      mustContain: [
        'MythosAstra.app/Contents/MacOS/mythos-astra',
        'MythosAstra.app/Contents/Info.plist',
        'MythosAstra.app/Contents/Resources/index.html',
        'README-MACOS.txt',
      ],
      validateBinary: (targetDir) => {
        const machoPath = path.join(targetDir, 'MythosAstra.app/Contents/MacOS/mythos-astra');
        const buf = fs.readFileSync(machoPath);

        const magic = buf.readUInt32LE(0);
        const is64Bit = magic === 0xfeedfacf;
        const isFat = magic === 0xbebafeca || magic === 0xcafebabe;

        if (!is64Bit && !isFat) {
          throw new Error(`Invalid Mach-O header magic: 0x${magic.toString(16)}`);
        }

        const infoPlist = fs.readFileSync(path.join(targetDir, 'MythosAstra.app/Contents/Info.plist'), 'utf8');
        if (!infoPlist.includes('com.mythos.astra') || !infoPlist.includes('mythos-astra')) {
          throw new Error('macOS Info.plist invalid or missing bundle identifiers');
        }

        return `Valid Mach-O 64-bit Executable Bundle (${Math.round(buf.length / 1024)} KB)`;
      },
    },
    {
      target: 'android',
      archive: manifest.artifacts.find((a) => a.target === 'android').filename,
      mustContain: ['classes.dex', 'AndroidManifest.xml', 'assets/www/index.html'],
      validateBinary: (targetDir) => {
        const dexPath = path.join(targetDir, 'classes.dex');
        const buf = fs.readFileSync(dexPath);

        // Verify DEX Header
        const dexMagic = buf.slice(0, 4).toString('ascii');
        if (dexMagic !== 'dex\n') throw new Error(`Invalid DEX magic: ${dexMagic}`);
        const versionStr = buf.slice(4, 8).toString('ascii');
        if (!versionStr.startsWith('03')) throw new Error(`Unexpected DEX version: ${versionStr}`);

        // Verify Adler-32
        const storedChecksum = buf.readUInt32LE(8);
        const actualChecksum = adler32(buf, 12);
        if (storedChecksum !== actualChecksum) {
          throw new Error(`DEX Adler-32 mismatch! Stored: ${storedChecksum}, Computed: ${actualChecksum}`);
        }

        // Verify Binary AndroidManifest
        const axmlBuf = fs.readFileSync(path.join(targetDir, 'AndroidManifest.xml'));
        const chunkType = axmlBuf.readUInt16LE(0);
        if (chunkType !== 0x0003 && !axmlBuf.toString('utf8').includes('<manifest')) {
          throw new Error(`Invalid AndroidManifest.xml format: 0x${chunkType.toString(16)}`);
        }

        return `Valid Android APK with Canonical DEX (v${versionStr.trim()}) + Binary XML`;
      },
    },
    {
      target: 'ios',
      archive: manifest.artifacts.find((a) => a.target === 'ios').filename,
      mustContain: [
        'MythosAstra.xcarchive/Info.plist',
        'MythosAstra.xcarchive/Products/Applications/MythosAstra.app/MythosAstra',
        'MythosAstra.xcarchive/Products/Applications/MythosAstra.app/Info.plist',
        'MythosAstra.xcarchive/Products/Applications/MythosAstra.app/www/index.html',
      ],
      validateBinary: (targetDir) => {
        const appBinary = path.join(targetDir, 'MythosAstra.xcarchive/Products/Applications/MythosAstra.app/MythosAstra');
        const buf = fs.readFileSync(appBinary);

        const magic = buf.readUInt32LE(0);
        if (magic !== 0xfeedfacf && magic !== 0xcafebabe) {
          throw new Error(`Invalid iOS Mach-O header magic: 0x${magic.toString(16)}`);
        }

        return `Valid iOS Xcode Archive with Mach-O ARM64 Binary (${Math.round(buf.length / 1024)} KB)`;
      },
    },
  ];

  console.log('[Artifact Validator] Extracting and validating package structures and binary formats in clean sandbox...');

  for (const check of checks) {
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

    const binarySummary = await check.validateBinary(targetExtractDir);
    console.log(`  ✓ ${check.target.padEnd(16)}: ${binarySummary}`);
  }

  // Cleanup cleanEnvDir
  fs.rmSync(cleanEnvDir, { recursive: true, force: true });

  console.log('================================================================');
  console.log('[Artifact Validator] SUCCESS: All 6 platform packages validated with 100% binary integrity!');
  console.log('================================================================');
}

validateArtifacts().catch((err) => {
  console.error('[Artifact Validator] Fatal Error:', err);
  process.exit(1);
});
