# Mythos: Astra & The Seven Realms — Multi-Platform Release Guide
**Document Version:** 2.0.0-PROD  
**Classification:** DevOps & Production Distribution Guide  
**Status:** Certified for Production Release v1.0.0  

---

## 1. Versioning Strategy (Semantic Versioning)

The project adheres to **Semantic Versioning 2.0.0** (`MAJOR.MINOR.PATCH`):
- **MAJOR:** Incompatible architectural overhauls or new major Realm expansions.
- **MINOR:** Backward-compatible features, new gameplay mechanics, or stage deliverables.
- **PATCH:** Backward-compatible bug fixes, performance optimizations, or documentation updates.

Current Certified Production Release: **`v1.0.0`** (Base Package Version `0.1.0`)

---

## 2. Multi-Platform Artifact Matrix

All release artifacts are generated during automated CI build runs and cryptographically hashed with SHA-256:

| Platform | Target Artifact File | Distribution Type | Signature Status | Runner Platform |
| :--- | :--- | :--- | :--- | :--- |
| **Web** | `mythos-astra-web-v0.1.0.zip` | Static PWA Web Distribution | Signed / Verified | `ubuntu-latest` |
| **Windows** | `mythos-astra-windows-x64-v0.1.0.zip` | Win32 x64 Standalone Executable | Unsigned (No SmartScreen cert) | `windows-latest` |
| **Linux** | `mythos-astra-linux-x64-v0.1.0.tar.gz` | Linux x64 Standalone Archive | Standard POSIX | `ubuntu-latest` |
| **macOS** | `mythos-astra-macos-universal-unsigned-v0.1.0.zip` | macOS Universal Application | **Unsigned Development Build** | `macos-14` |
| **Android** | `mythos-astra-android-v0.1.0-debug.apk` | Android APK (Debug / Sideload) | Debug Key Signed | `ubuntu-latest` |
| **iOS** | `mythos-astra-ios-v0.1.0-unsigned.xcarchive.zip` | iOS Xcode Archive | **Unsigned Development Build** | `macos-14` |

> **Important Disclosure on Apple Artifacts:** In accordance with Apple Developer guidelines, macOS and iOS binaries built in automated open CI without paid enterprise provisioning certificates are explicitly labeled as **Unsigned Development Builds**. Users on macOS must approve execution in *System Preferences > Security & Privacy*.

---

## 3. Cryptographic Verification (SHA-256)

Every release includes a companion `SHA256SUMS.txt` file in the release assets. To verify package authenticity:

### On Linux / macOS:
```bash
sha256sum -c SHA256SUMS.txt
```

### On Windows PowerShell:
```powershell
Get-FileHash -Algorithm SHA256 .\mythos-astra-windows-x64-v0.1.0.zip
```

Compare the resulting hash against the entry in `SHA256SUMS.txt`.

---

## 4. Software Bill of Materials (SBOM)

Every release contains two automated dependency audits in the distribution root:
1. `SBOM.json`: CycloneDX 1.4 compliant Software Bill of Materials.
2. `DEPENDENCY_MANIFEST.json`: Complete inventory of runtime and development dependencies with licensed declarations.
