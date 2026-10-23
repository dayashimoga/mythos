# Mythos: Astra & The Seven Realms — Environment Setup Guide
**Document Version:** 1.3.0-PROD  
**Classification:** DevOps & Developer Setup Guide  
**Status:** Certified Stage 1 Cross-Platform Baseline  

---

## 1. Prerequisites & Toolchain Requirements

Ensure the following runtimes and compilers are installed on your workstation:

| Runtime / Tool | Minimum Version | Recommended Version | Verification Command | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` | `20.18.x LTS` | `node --version` | Required for engine, tools, and Vite |
| **npm** | `>= 10.0.0` | `10.8.x` | `npm --version` | Package manager |
| **Rust / Cargo** | `>= 1.80.0` | `1.97.x Stable` | `cargo --version` | Required for Tauri 2 desktop native compilation |
| **Git** | `>= 2.30.0` | `2.40+` | `git --version` | Version control & append-only git history |
| **Java / JDK** | `>= 17.0.0` | `17.x Temurin` | `java -version` | Required for Android Gradle native APK builds |
| **Xcode** | `>= 15.0` | `15.2+` | `xcodebuild -version` | Required for macOS and iOS Apple builds (macOS host) |
| **Web Browser** | Evergreen | Chrome 120+, Edge 120+, Firefox 120+, Safari 16+ | — | Hardware-accelerated Canvas2D & WebGL |

---

## 2. Installation & Quickstart

Clone the repository and install all pinned dependencies:

```bash
# 1. Clone repository
git clone https://github.com/dayashimoga/mythos.git
cd mythos

# 2. Install pinned dependencies
npm ci
```

---

## 3. Local Development Server

Launch the Vite hot-module-reloading (HMR) development server:

```bash
npm run dev
```

The application will start immediately at:
`http://localhost:3000` (or `http://localhost:5173` depending on port availability).

Open your browser to test and play. Any edits to `src/` will hot-reload instantaneously.

---

## 4. Test Suite Execution & Coverage

Execute the automated test suite powered by Vitest and V8 coverage:

```bash
# Run all unit, integration, UI, and benchmark tests
npm run test

# Run tests in interactive watch mode
npm run test:watch

# Run test coverage and enforce >= 90% threshold
npm run test:coverage

# Run Playwright E2E visual regression suite across 4 viewports
npm run test:e2e
```

Test results and HTML coverage reports are output to `coverage/index.html`.

---

## 5. Typechecking & Integrity Verification

```bash
# Typecheck TypeScript codebase with strict mode
npm run lint

# Verify append-only constraints for TODO.md & CHANGELOG.md
npm run verify:append-only
```

---

## 6. Building Production Bundles & Multi-Platform Artifacts

```bash
# 1. Compile production distribution (TypeScript + Vite)
npm run build

# 2. Generate CycloneDX SBOM and Dependency Manifest
npm run generate:sbom

# 3. Compile native desktop host & package all 6 target platforms
npm run build:platforms

# 4. Validate binary headers, checksums, and package integrity in clean sandbox
npm run validate:artifacts

# 5. Preview the web production build locally
npm run preview
```

All distribution bundles, binary formats, and cryptographic hashes will be generated in:
`dist/release-artifacts/`
- `mythos-astra-web-v0.1.0.zip` (PWA distribution)
- `mythos-astra-windows-x64-v0.1.0.zip` (Genuine PE32+ x64 `.exe` + `WebView2Loader.dll`)
- `mythos-astra-linux-x64-v0.1.0.tar.gz` (Genuine ELF 64-bit standalone executable)
- `mythos-astra-macos-universal-unsigned-v0.1.0.zip` (Genuine Mach-O 64-bit `.app` bundle)
- `mythos-astra-android-v0.1.0-debug.apk` (Genuine APK with `classes.dex` and binary XML)
- `mythos-astra-ios-v0.1.0-unsigned.xcarchive.zip` (Genuine Xcode archive with Mach-O ARM64)
- `SHA256SUMS.txt`
- `RELEASE_MANIFEST.json`
