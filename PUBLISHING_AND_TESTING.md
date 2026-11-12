# NEXVION — Free Publishing, Costs & Testing Checklist

## 1. Zero-Budget (₹0) Publishing & Platform Limits
- **GitHub Private Repository:** Free ($0 / ₹0) with unlimited private repositories and 2,000 free GitHub Actions minutes/month for automated Windows (`.exe`), Linux (`.AppImage`, `.deb`), and macOS (`.dmg`) builds.
- **PWA Hosting (Netlify / GitHub Pages / Cloudflare Pages):** Free ($0 / ₹0) static hosting for the `mobile/` PWA and `website/`.
- **PWA Code Visibility Note:** Even when your GitHub source repository is set to **Private**, any HTML/CSS/JS files deployed to a public website URL for a Progressive Web App can be inspected by users via browser developer tools. Never store private API keys or secrets inside `mobile/` or `website/`.
- **App Store & Code-Signing Reality (Honest Disclosure):**
  - **Apple App Store / iOS Native IPA:** Costs **$99/year** for an Apple Developer account (requires age 18+ legal agreement). Using Safari **Add to Home Screen** with the NEXVION PWA costs **₹0** and requires no App Store fee.
  - **Google Play Store:** Costs **$25 one-time** registration fee (age 18+). An Android APK wrapper (such as Trusted Web Activity / Capacitor) can be built for **₹0** via GitHub Actions and sideloaded without Play Store fees.
  - **Windows / macOS Code Signing:** Commercial EV/Developer certificates cost $99–$300+/year. Unsigned builds created by GitHub Actions work for personal use and testing (users click "More info -> Run anyway" on Windows SmartScreen or Right-click -> Open on macOS).

---

## 2. NEXVION Verification & Testing Checklist

| Feature | Code Written | Build Completed | Application Tested | Working Status |
| :--- | :---: | :---: | :---: | :--- |
| Empty Game Library on First Launch | Yes | Pending CI | Pending Device Test | Ready for Build |
| Game File & Folder Importing | Yes | Pending CI | Pending Device Test | Ready for Build |
| Custom Game Names & Custom Covers | Yes | Pending CI | Pending Device Test | Ready for Build |
| File Location, Size & Missing File Scan | Yes | Pending CI | Pending Device Test | Ready for Build |
| Remove Game (Preserves Original Files) | Yes | Pending CI | Pending Device Test | Ready for Build |
| Emulator Manager (RetroArch, PCSX2, RPCS3, shadPS4, Dolphin, Cemu, Switch) | Yes | Pending CI | Pending Device Test | Ready for Build |
| SmartCheck (GREEN / YELLOW / RED + OS/RAM/Arch) | Yes | Pending CI | Pending Device Test | Ready for Build |
| SmartBridge (Native, Compatibility Mode, Remote Play) | Yes | Pending CI | Pending Device Test | Ready for Build |
| Mobile PWA & Safari Add to Home Screen | Yes | Ready | Pending iPhone Safari Test | Ready for Deploy |
| GitHub Actions Multi-OS Desktop Builds | Yes | Pending Workflow Run | Pending Artifact Download | Ready for CI |
