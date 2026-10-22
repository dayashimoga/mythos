# Mythos: Astra & The Seven Realms — Environment Setup Guide
**Document Version:** 1.0.0-PROD  
**Classification:** DevOps & Developer Setup Guide  
**Status:** Canonical & Baseline Frozen for Stage 0  

---

## 1. Prerequisites & Toolchain Requirements

Ensure the following runtimes and compilers are installed on your workstation:

| Runtime / Tool | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` | `20.18.x LTS` | `node --version` |
| **npm** | `>= 10.0.0` | `10.8.x` | `npm --version` |
| **Git** | `>= 2.30.0` | `2.40+` | `git --version` |
| **Web Browser** | Evergreen | Chrome 120+, Edge 120+, Firefox 120+, Safari 16+ | — |

---

## 2. Installation & Quickstart

Clone the repository and install all pinned dependencies:

```bash
# 1. Clone repository
git clone https://github.com/organization/mythos-astra-game.git
cd mythos-astra-game

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

# 3. Package all 5 target platform release bundles with SHA-256 hashes
npm run build:platforms

# 4. Preview the production build locally
npm run preview
```

All distribution bundles and cryptographic hashes will be generated in:
`dist/release-artifacts/`
- `mythos-astra-web-v0.1.0.zip`
- `mythos-astra-windows-x64-v0.1.0.zip`
- `mythos-astra-linux-x64-v0.1.0.tar.gz`
- `mythos-astra-macos-universal-unsigned-v0.1.0.zip`
- `mythos-astra-android-v0.1.0-debug.apk`
- `mythos-astra-ios-v0.1.0-unsigned.xcarchive.zip`
- `SHA256SUMS.txt`
- `RELEASE_MANIFEST.json`
