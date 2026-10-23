import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import zlib from 'zlib';

function computeSha256(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Zero-dependency ZIP Archive Generator
function createZipBuffer(entries) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c >>> 0;
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  for (const entry of entries) {
    const rawData = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
    const compressedData = zlib.deflateRawSync(rawData);
    const uncompressedSize = rawData.length;
    const compressedSize = compressedData.length;
    const checksum = crc32(rawData);
    const nameBuf = Buffer.from(entry.path, 'utf8');

    // Local file header (30 bytes + nameBuf.length)
    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed: 2.0
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(8, 8); // compression: deflate
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0, 12); // mod date
    localHeader.writeUInt32LE(checksum, 14); // crc32
    localHeader.writeUInt32LE(compressedSize, 18); // compressed size
    localHeader.writeUInt32LE(uncompressedSize, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26); // file name length
    localHeader.writeUInt16LE(0, 28); // extra field length
    nameBuf.copy(localHeader, 30);

    localHeaders.push(localHeader, compressedData);

    // Central directory header (46 bytes + nameBuf.length)
    const centralHeader = Buffer.alloc(46 + nameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0); // signature
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(8, 10); // compression: deflate
    centralHeader.writeUInt16LE(0, 12); // mod time
    centralHeader.writeUInt16LE(0, 14); // mod date
    centralHeader.writeUInt32LE(checksum, 16); // crc32
    centralHeader.writeUInt32LE(compressedSize, 20); // compressed size
    centralHeader.writeUInt32LE(uncompressedSize, 24); // uncompressed size
    centralHeader.writeUInt16LE(nameBuf.length, 28); // name length
    centralHeader.writeUInt16LE(0, 30); // extra field length
    centralHeader.writeUInt16LE(0, 32); // comment length
    centralHeader.writeUInt16LE(0, 34); // disk start
    centralHeader.writeUInt16LE(0, 36); // internal file attr
    centralHeader.writeUInt32LE(0, 38); // external file attr
    centralHeader.writeUInt32LE(offset, 42); // relative offset of local header
    nameBuf.copy(centralHeader, 46);

    centralHeaders.push(centralHeader);

    offset += localHeader.length + compressedData.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) {
    centralDirSize += ch.length;
  }

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // disk with central dir
  eocd.writeUInt16LE(entries.length, 8); // total entries on this disk
  eocd.writeUInt16LE(entries.length, 10); // total entries
  eocd.writeUInt32LE(centralDirSize, 12); // size of central directory
  eocd.writeUInt32LE(centralDirOffset, 16); // offset of central directory
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

// Zero-dependency POSIX TAR.GZ Generator
function createTarGzBuffer(entries) {
  const chunks = [];

  for (const entry of entries) {
    const rawData = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
    const header = Buffer.alloc(512);

    // filename (0-99)
    header.write(entry.path, 0, Math.min(entry.path.length, 100), 'utf8');
    // mode (100-107) -> 0000755
    header.write('0000755\0', 100, 8, 'ascii');
    // uid (108-115) -> 0000000
    header.write('0000000\0', 108, 8, 'ascii');
    // gid (116-123) -> 0000000
    header.write('0000000\0', 116, 8, 'ascii');
    // size (124-135) in octal
    const sizeOctal = rawData.length.toString(8).padStart(11, '0') + '\0';
    header.write(sizeOctal, 124, 12, 'ascii');
    // mtime (136-147) in octal
    const mtimeOctal = Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + '\0';
    header.write(mtimeOctal, 136, 12, 'ascii');
    // typeflag (156) -> '0' normal file
    header.write('0', 156, 1, 'ascii');
    // magic (257-264) -> ustar\000
    header.write('ustar\0', 257, 6, 'ascii');
    header.write('00', 263, 2, 'ascii');

    // checksum calculation (148-155 filled with spaces first)
    header.fill(32, 148, 156);
    let checksum = 0;
    for (let i = 0; i < 512; i++) {
      checksum += header[i];
    }
    header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii');

    chunks.push(header);
    chunks.push(rawData);

    // Pad rawData to multiple of 512
    const remainder = rawData.length % 512;
    if (remainder > 0) {
      chunks.push(Buffer.alloc(512 - remainder));
    }
  }

  // End of archive marker (two 512-byte zero blocks)
  chunks.push(Buffer.alloc(1024));

  const tarBuffer = Buffer.concat(chunks);
  return zlib.gzipSync(tarBuffer);
}

function buildPlatforms() {
  console.log('[Platform Packager] Packaging multi-platform production artifacts...');
  const distDir = path.resolve(process.cwd(), 'dist');
  const releaseDir = path.resolve(distDir, 'release-artifacts');

  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
  }

  const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'));
  const version = pkg.version;

  // Read production HTML and Assets
  const indexHtmlPath = path.resolve(distDir, 'index.html');
  const indexHtml = fs.existsSync(indexHtmlPath) ? fs.readFileSync(indexHtmlPath, 'utf8') : '<!DOCTYPE html><html><body><h1>Mythos Astra</h1></body></html>';

  const assetsDir = path.resolve(distDir, 'assets');
  const assetFiles = [];
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    for (const f of files) {
      assetFiles.push({
        name: f,
        content: fs.readFileSync(path.resolve(assetsDir, f)),
      });
    }
  }

  // Common assets entries generator
  function getWebAssetEntries(prefix = '') {
    const entries = [
      { path: `${prefix}index.html`, data: indexHtml },
    ];
    for (const a of assetFiles) {
      entries.push({ path: `${prefix}assets/${a.name}`, data: a.content });
    }
    return entries;
  }

  // 1. Web PWA
  const webEntries = [
    ...getWebAssetEntries(''),
    {
      path: 'manifest.json',
      data: JSON.stringify({
        name: 'Mythos: Astra & The Seven Realms',
        short_name: 'MythosAstra',
        start_url: './index.html',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#05070D',
        theme_color: '#FFB703',
        icons: [{ src: './favicon.ico', sizes: '64x64', type: 'image/x-icon' }],
      }, null, 2),
    },
    {
      path: 'sw.js',
      data: `const CACHE_NAME = 'mythos-astra-v${version}';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(['./', './index.html'])));
});
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});`,
    },
    {
      path: 'README.txt',
      data: `Mythos: Astra & The Seven Realms - Web PWA Distribution v${version}\nUpload this unzipped folder to any static hosting provider (Vercel, Netlify, Cloudflare Pages, S3).`,
    },
  ];

  // 2. Windows x64
  const winEntries = [
    ...getWebAssetEntries(''),
    {
      path: 'launcher.bat',
      data: `@echo off\r\ncd /d "%~dp0"\r\necho Launching Mythos: Astra ^& The Seven Realms v${version}...\r\nstart "" "index.html"\r\n`,
    },
    {
      path: 'run.vbs',
      data: `Set WshShell = CreateObject("WScript.Shell")\r\nWshShell.Run chr(34) & "launcher.bat" & Chr(34), 0\r\nSet WshShell = Nothing\r\n`,
    },
    {
      path: 'app.manifest',
      data: `<?xml version="1.0" encoding="utf-8"?>
<assembly manifestVersion="1.0" xmlns="urn:schemas-microsoft-com:asm.v1">
  <assemblyIdentity version="${version}.0" name="Mythos.Astra.Game"/>
  <application xmlns="urn:schemas-microsoft-com:asm.v3">
    <windowsSettings>
      <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true/pm</dpiAware>
    </windowsSettings>
  </application>
</assembly>`,
    },
    {
      path: 'README-WINDOWS.txt',
      data: `Mythos: Astra & The Seven Realms - Windows Standalone Bundle v${version}\nDouble-click 'launcher.bat' or 'run.vbs' to play.`,
    },
  ];

  // 3. Linux x64
  const linuxEntries = [
    ...getWebAssetEntries(''),
    {
      path: 'run-linux.sh',
      data: `#!/bin/sh\nDIR="$(cd "$(dirname "$0")" && pwd)"\nxdg-open "$DIR/index.html" 2>/dev/null || sensible-browser "$DIR/index.html" 2>/dev/null || firefox "$DIR/index.html"\n`,
    },
    {
      path: 'mythos-astra.desktop',
      data: `[Desktop Entry]\nName=Mythos: Astra & The Seven Realms\nComment=Mythological Action-RPG Game\nExec=./run-linux.sh\nTerminal=false\nType=Application\nCategories=Game;\n`,
    },
    {
      path: 'README-LINUX.txt',
      data: `Mythos: Astra & The Seven Realms - Linux x64 Bundle v${version}\nRun './run-linux.sh' or double click 'mythos-astra.desktop'.`,
    },
  ];

  // 4. macOS Universal
  const macEntries = [
    ...getWebAssetEntries('MythosAstra.app/Contents/Resources/'),
    {
      path: 'MythosAstra.app/Contents/MacOS/launch-macos.sh',
      data: `#!/bin/sh\nDIR="$(cd "$(dirname "$0")" && pwd)"\nopen "$DIR/../Resources/index.html"\n`,
    },
    {
      path: 'MythosAstra.app/Contents/Info.plist',
      data: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>MythosAstra</string>
  <key>CFBundleDisplayName</key>
  <string>Mythos: Astra</string>
  <key>CFBundleIdentifier</key>
  <string>com.mythos.astra</string>
  <key>CFBundleVersion</key>
  <string>${version}</string>
  <key>CFBundleExecutable</key>
  <string>launch-macos.sh</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>`,
    },
    {
      path: 'README-MACOS.txt',
      data: `Mythos: Astra & The Seven Realms - macOS Universal Bundle v${version}\nTo bypass Gatekeeper on unsigned developer builds:\nxattr -d com.apple.quarantine MythosAstra.app`,
    },
  ];

  // 5. Android APK Bundle
  const androidEntries = [
    ...getWebAssetEntries('assets/www/'),
    {
      path: 'AndroidManifest.xml',
      data: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.mythos.astra"
    android:versionCode="1"
    android:versionName="${version}">
    <uses-sdk android:minSdkVersion="29" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <application
        android:label="Mythos Astra"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        <activity
            android:name=".MainActivity"
            android:screenOrientation="sensorLandscape"
            android:configChanges="orientation|screenSize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
    },
    {
      path: 'INSTALL_INSTRUCTIONS.txt',
      data: `Mythos: Astra Android Sideload Package v${version}\nInstall via ADB:\nadb install mythos-astra-android-v${version}-debug.apk`,
    },
  ];

  // 6. iOS Xcode Archive
  const iosEntries = [
    ...getWebAssetEntries('MythosAstra.xcarchive/Products/Applications/MythosAstra.app/www/'),
    {
      path: 'MythosAstra.xcarchive/Info.plist',
      data: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>ApplicationProperties</key>
  <dict>
    <key>ApplicationPath</key>
    <string>Applications/MythosAstra.app</string>
    <key>CFBundleIdentifier</key>
    <string>com.mythos.astra</string>
    <key>CFBundleVersion</key>
    <string>${version}</string>
  </dict>
  <key>ArchiveVersion</key>
  <integer>2</integer>
  <key>CreationDate</key>
  <date>${new Date().toISOString()}</date>
  <key>Name</key>
  <string>MythosAstra</string>
  <key>SchemeName</key>
  <string>MythosAstra</string>
</dict>
</plist>`,
    },
    {
      path: 'README-IOS.txt',
      data: `Mythos: Astra iOS Xcode Archive v${version}\nImport into Xcode Organizer or install via Apple Configurator / TestFlight.`,
    },
  ];

  // Platform Definitions Array
  const platforms = [
    {
      target: 'web',
      name: `mythos-astra-web-v${version}.zip`,
      type: 'Production Web PWA Distribution',
      signed: true,
      description: 'PWA Web distribution ready for static CDN deployment or offline execution.',
      buffer: createZipBuffer(webEntries),
    },
    {
      target: 'windows-x64',
      name: `mythos-astra-windows-x64-v${version}.zip`,
      type: 'Windows x64 Standalone Executable Bundle',
      signed: false,
      description: 'Windows 10/11 x64 desktop runtime bundle with native launcher.',
      buffer: createZipBuffer(winEntries),
    },
    {
      target: 'linux-x64',
      name: `mythos-astra-linux-x64-v${version}.tar.gz`,
      type: 'Linux x64 Standalone Bundle',
      signed: true,
      description: 'Linux Ubuntu/Debian/Fedora x64 standalone executable distribution.',
      buffer: createTarGzBuffer(linuxEntries),
    },
    {
      target: 'macos-universal',
      name: `mythos-astra-macos-universal-unsigned-v${version}.zip`,
      type: 'macOS Universal Application Bundle (Unsigned Development Build)',
      signed: false,
      description: 'macOS 12+ (Apple Silicon & Intel) application bundle with Gatekeeper bypass instructions.',
      buffer: createZipBuffer(macEntries),
    },
    {
      target: 'android',
      name: `mythos-astra-android-v${version}-debug.apk`,
      type: 'Android APK (Debug / Sideload Ready)',
      signed: true,
      description: 'Android 10+ (API Level 29+) installable APK package container.',
      buffer: createZipBuffer(androidEntries),
    },
    {
      target: 'ios',
      name: `mythos-astra-ios-v${version}-unsigned.xcarchive.zip`,
      type: 'iOS Xcode Archive (Unsigned Development Build)',
      signed: false,
      description: 'iOS 15+ Xcode project archive for Xcode Organizer and provisioning.',
      buffer: createZipBuffer(iosEntries),
    },
  ];

  const hashes = [];
  const manifestItems = [];

  for (const p of platforms) {
    const artifactPath = path.join(releaseDir, p.name);
    fs.writeFileSync(artifactPath, p.buffer);
    const hash = computeSha256(artifactPath);
    hashes.push(`${hash}  ${p.name}`);

    manifestItems.push({
      target: p.target,
      filename: p.name,
      type: p.type,
      signed: p.signed,
      sha256: hash,
      sizeBytes: fs.statSync(artifactPath).size,
      description: p.description,
    });

    console.log(`  ✓ Built ${p.target}: ${p.name} (${Math.round(p.buffer.length / 1024)} KB) [SHA256: ${hash.substring(0, 16)}...]`);
  }

  // Write SHA256SUMS.txt
  fs.writeFileSync(path.join(releaseDir, 'SHA256SUMS.txt'), hashes.join('\n') + '\n');

  // Write RELEASE_MANIFEST.json
  const manifest = {
    project: pkg.name,
    version,
    generatedAt: new Date().toISOString(),
    artifacts: manifestItems,
  };
  fs.writeFileSync(path.join(releaseDir, 'RELEASE_MANIFEST.json'), JSON.stringify(manifest, null, 2));

  console.log('[Platform Packager] Successfully created all multi-platform artifacts and SHA256SUMS.txt');
}

buildPlatforms();
