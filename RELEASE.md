# Mythos: Astra & The Seven Realms — Multi-Platform Release Guide
**Document Version:** 2.1.0-PROD  
**Classification:** DevOps & Production Distribution Guide  
**Status:** Certified Stage 1 Cross-Platform Delivery  

---

## 1. Versioning Strategy (Semantic Versioning)

The project adheres to **Semantic Versioning 2.0.0** (`MAJOR.MINOR.PATCH`):
- **MAJOR:** Incompatible architectural overhauls or new major Realm expansions.
- **MINOR:** Backward-compatible features, new gameplay mechanics, or stage deliverables.
- **PATCH:** Backward-compatible bug fixes, performance optimizations, or documentation updates.

Current Certified Production Release: **`v1.3.0`** (Base Package Version `0.1.0`)

---

## 2. Multi-Platform Artifact Matrix

All release artifacts are generated via native platform compilers and packagers, cryptographically hashed with SHA-256:

| Platform | Target Artifact File | Executable Binary Format | Distribution Type | Signature Status | Runner Platform |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Web** | `mythos-astra-web-v0.1.0.zip` | HTML5 / JavaScript PWA Bundle | Static PWA Web Distribution | Signed / Verified | `ubuntu-latest` |
| **Windows** | `mythos-astra-windows-x64-v0.1.0.zip` | PE32+ (x86_64) Native Executable | Win32 x64 Native Desktop Application | Unsigned (No EV CodeSign cert) | `windows-latest` |
| **Linux** | `mythos-astra-linux-x64-v0.1.0.tar.gz` | ELF 64-bit LSB (x86-64) Executable | Linux x64 Standalone Archive | Standard POSIX | `ubuntu-latest` |
| **macOS** | `mythos-astra-macos-universal-unsigned-v0.1.0.zip` | Mach-O 64-bit Application Binary | macOS Universal Application Bundle | **Unsigned Development Build** | `macos-14` |
| **Android** | `mythos-astra-android-v0.1.0-debug.apk` | Dalvik Executable (`classes.dex`) + Binary XML | Android APK (Debug / Sideload) | Debug Keystore Signed | `ubuntu-latest` |
| **iOS** | `mythos-astra-ios-v0.1.0-unsigned.xcarchive.zip` | Mach-O 64-bit ARM64 Executable | iOS Xcode Archive | **Unsigned Development Build** | `macos-14` |

> **Important Disclosure on Unsigned Builds:** In accordance with platform security policies:
> - **macOS:** Unsigned developer builds trigger Gatekeeper. Users must authorize execution via `System Settings > Privacy & Security` or run `xattr -d com.apple.quarantine MythosAstra.app`.
> - **iOS:** Xcode archives built without paid Apple Developer Team provisioning profiles are labeled as **Unsigned Development Builds**. Sideloading requires AltStore, Sideloadly, or Xcode Organizer.
> - **Android:** Debug APKs are signed with the standard Android debug keystore and can be sideloaded directly via `adb install` with unknown sources enabled.

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
3. `RELEASE_MANIFEST.json`: Machine-readable catalogue of artifact filenames, binary architectures, SHA-256 hashes, and execution formats.
