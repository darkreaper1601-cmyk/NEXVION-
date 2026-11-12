# NEXVION — Universal Game Launcher

**YOUR GAMES. YOUR DEVICES.**

NEXVION is a cross-platform Universal Game Launcher and SmartCheck compatibility manager designed for desktop (Windows, Linux, macOS) and mobile devices (iOS Safari PWA & Android).

## Core Principles
- **Empty Library First:** NEXVION ships with zero preloaded games, ROMs, ISOs, or BIOS files.
- **User-Supplied Content:** Users import their own legally obtained PC executables, game folders, and console backups.
- **SmartCheck Diagnostics:** Inspects executable types, target OS, CPU architecture, and system memory to provide honest `GREEN`, `YELLOW`, or `RED` compatibility guidance.
- **SmartBridge Launch Routing:** Supports **Native Launch**, **Compatibility Mode** (Wine/Proton), and **Remote Play** streaming.

## Project Structure
```text
NEXVION/
├── desktop/               # Electron desktop application (Windows, Linux, macOS)
├── mobile/                # Responsive Progressive Web App (iOS Safari & Android)
├── shared/                # Shared SmartCheck, SmartBridge & Emulator definitions
├── website/               # Public landing page for free static hosting
├── docs/                  # Free publishing guide & testing checklist
└── .github/workflows/     # Automated multi-OS GitHub Actions build pipeline
```
