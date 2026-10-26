import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const targetDir = path.resolve(rootDir, 'dist-tauri');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDir, { recursive: true });

// Copy index.html
const indexHtmlPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  fs.copyFileSync(indexHtmlPath, path.join(targetDir, 'index.html'));
}

// Copy assets directory, skipping large .map and .pck files
const distAssets = path.join(distDir, 'assets');
const targetAssets = path.join(targetDir, 'assets');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const ent of entries) {
    const srcPath = path.join(src, ent.name);
    const destPath = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === '3d' || ent.name === 'release-artifacts' || ent.name === 'clean-env-validation') continue;
      copyDirRecursive(srcPath, destPath);
    } else if (ent.isFile()) {
      if (ent.name.endsWith('.map') || ent.name.endsWith('.pck') || ent.name.endsWith('.tar.gz') || ent.name.endsWith('.zip')) continue;
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirRecursive(distAssets, targetAssets);
console.log('[Tauri Dist Prep] Successfully prepared clean dist-tauri assets.');
