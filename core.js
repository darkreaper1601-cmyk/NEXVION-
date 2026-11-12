/**
 * NEXVION Shared Core Engine
 * Official Identity: NEXVION - Universal Game Launcher
 * Tagline: YOUR GAMES. YOUR DEVICES.
 */

const NEXVION_CORE = (() => {
  const EMULATORS = {
    retroarch: {
      id: "retroarch",
      name: "RetroArch",
      systems: ["NES", "SNES", "GBA", "GBC", "GB", "N64", "PS1", "PSP", "Sega Genesis", "Arcade"],
      extensions: [".nes", ".sfc", ".smc", ".gba", ".gbc", ".gb", ".n64", ".z64", ".v64", ".cue", ".bin", ".chd", ".iso", ".cso", ".md", ".gen"],
      website: "https://www.retroarch.com",
      defaultArgs: ["-L", "{core}", "{rom}"],
      notes: "Requires selecting the appropriate libretro core inside RetroArch."
    },
    pcsx2: {
      id: "pcsx2",
      name: "PCSX2",
      systems: ["PlayStation 2 (PS2)"],
      extensions: [".iso", ".bin", ".chd", ".cso", ".gz"],
      website: "https://pcsx2.net",
      defaultArgs: ["-batch", "-fullscreen", "{rom}"],
      notes: "Requires user-supplied legal PS2 BIOS dumped from your own console."
    },
    rpcs3: {
      id: "rpcs3",
      name: "RPCS3",
      systems: ["PlayStation 3 (PS3)"],
      extensions: [".bin", ".eboot", ".iso"],
      website: "https://rpcs3.net",
      defaultArgs: ["--no-gui", "{rom}"],
      notes: "Requires official Sony PS3 firmware (PS3UPDAT.PUP) installed by the user."
    },
    shadps4: {
      id: "shadps4",
      name: "shadPS4",
      systems: ["PlayStation 4 (PS4) - Experimental"],
      extensions: [".pkg", ".bin"],
      website: "https://shadps4.net",
      defaultArgs: ["{rom}"],
      notes: "Experimental compatibility. Requires high-end x86_64 hardware and Vulkan support."
    },
    dolphin: {
      id: "dolphin",
      name: "Dolphin",
      systems: ["GameCube", "Wii"],
      extensions: [".iso", ".gcz", ".rvz", ".wbfs", ".wad", ".dol", ".elf"],
      website: "https://dolphin-emu.org",
      defaultArgs: ["-b", "-e", "{rom}"],
      notes: "Supports GameCube and Wii backups dumped from user-owned discs."
    },
    cemu: {
      id: "cemu",
      name: "Cemu",
      systems: ["Wii U"],
      extensions: [".wud", ".wux", ".rpx", ".wua"],
      website: "https://cemu.info",
      defaultArgs: ["-f", "-g", "{rom}"],
      notes: "Requires user-supplied keys.txt for encrypted WUD/WUX images."
    },
    switch_compat: {
      id: "switch_compat",
      name: "Compatible Switch Emulator (User-Supplied)",
      systems: ["Nintendo Switch (User-Supplied Emulator)"],
      extensions: [".nsp", ".xci", ".nro"],
      website: "https://github.com",
      defaultArgs: ["-f", "-g", "{rom}"],
      notes: "Users must supply a legitimate, compatible emulator binary plus keys/firmware dumped from their own console."
    }
  };

  const FILE_SIGNATURES = {
    ".exe": { type: "Windows Executable", targetOS: "win32", category: "PC Game" },
    ".msi": { type: "Windows Installer", targetOS: "win32", category: "PC Installer" },
    ".bat": { type: "Windows Batch Script", targetOS: "win32", category: "PC Script" },
    ".app": { type: "macOS Application Bundle", targetOS: "darwin", category: "PC Game" },
    ".dmg": { type: "macOS Disk Image", targetOS: "darwin", category: "PC Installer" },
    ".appimage": { type: "Linux AppImage Executable", targetOS: "linux", category: "PC Game" },
    ".sh": { type: "Unix/Linux Shell Script", targetOS: "linux", category: "PC Script" },
    ".deb": { type: "Debian/Ubuntu Package", targetOS: "linux", category: "PC Installer" },
    ".jar": { type: "Java Archive (e.g., Minecraft Java)", targetOS: "cross-platform", category: "PC Game" },
    ".apk": { type: "Android Package", targetOS: "android", category: "Mobile Game" },
    ".ipa": { type: "iOS Application Archive", targetOS: "ios", category: "Mobile Game" },
    ".gba": { type: "Game Boy Advance ROM", targetOS: "emulated", category: "Console ROM", emulator: "retroarch" },
    ".gbc": { type: "Game Boy Color ROM", targetOS: "emulated", category: "Console ROM", emulator: "retroarch" },
    ".gb": { type: "Game Boy ROM", targetOS: "emulated", category: "Console ROM", emulator: "retroarch" },
    ".nes": { type: "NES ROM", targetOS: "emulated", category: "Console ROM", emulator: "retroarch" },
    ".sfc": { type: "SNES ROM", targetOS: "emulated", category: "Console ROM", emulator: "retroarch" },
    ".smc": { type: "SNES ROM", targetOS: "emulated", category: "Console ROM", emulator: "retroarch" },
    ".n64": { type: "Nintendo 64 ROM", targetOS: "emulated", category: "Console ROM", emulator: "retroarch" },
    ".z64": { type: "Nintendo 64 ROM", targetOS: "emulated", category: "Console ROM", emulator: "retroarch" },
    ".iso": { type: "Disc Image (PS1/PS2/PS3/GC/Wii)", targetOS: "emulated", category: "Disc Image", emulator: "pcsx2" },
    ".chd": { type: "Compressed Hunks of Data", targetOS: "emulated", category: "Disc Image", emulator: "pcsx2" },
    ".rvz": { type: "Dolphin RVZ Disc Image", targetOS: "emulated", category: "Disc Image", emulator: "dolphin" },
    ".wbfs": { type: "Wii Backup File System", targetOS: "emulated", category: "Disc Image", emulator: "dolphin" },
    ".wua": { type: "Wii U Archive", targetOS: "emulated", category: "Disc Image", emulator: "cemu" },
    ".rpx": { type: "Wii U Executable", targetOS: "emulated", category: "Console Executable", emulator: "cemu" },
    ".nsp": { type: "Nintendo Submission Package", targetOS: "emulated", category: "Console Package", emulator: "switch_compat" },
    ".xci": { type: "NX Card Image", targetOS: "emulated", category: "Console Image", emulator: "switch_compat" },
    ".pkg": { type: "PlayStation Package", targetOS: "emulated", category: "Console Package", emulator: "shadps4" }
  };

  function getExtension(fileName) {
    if (!fileName) return "";
    const idx = fileName.lastIndexOf(".");
    return idx !== -1 ? fileName.slice(idx).toLowerCase() : "";
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 B (Folder / Reference)";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
  }

  /**
   * SmartCheck Engine
   * Evaluates game file vs host environment honestly without false guarantees.
   */
  function runSmartCheck(game, env) {
    const ext = getExtension(game.fileName || game.filePath);
    const sig = FILE_SIGNATURES[ext] || {
      type: ext ? `Unknown File (${ext})` : "Game Directory / Custom Entry",
      targetOS: "unknown",
      category: "Custom Entry"
    };

    const hostOS = env.platform || "unknown"; // 'win32', 'darwin', 'linux', 'android', 'ios', 'web'
    const arch = env.arch || "unknown";
    const totalRamGB = env.totalRamGB || null;
    const freeStorageGB = env.freeStorageGB || null;

    let status = "YELLOW"; // GREEN, YELLOW, RED
    let headline = "Compatibility Warning — Manual Verification Needed";
    let details = [];
    let recommendedBridge = "native";
    let requiredRuntime = sig.emulator ? EMULATORS[sig.emulator]?.name : "Native OS Runtime";

    // Rule 1: File existence check (Desktop)
    if (game.fileMissing) {
      status = "RED";
      headline = "Unsupported / Missing File — Target Not Found on Disk";
      details.push("The referenced file or folder no longer exists at the saved path.");
      return {
        status,
        headline,
        executableType: sig.type,
        targetOS: sig.targetOS,
        hostOS,
        arch,
        ramInfo: totalRamGB ? `${totalRamGB} GB` : "Browser Restricted",
        storageInfo: freeStorageGB ? `${freeStorageGB} GB free` : "Browser Restricted",
        requiredRuntime,
        recommendedBridge: "none",
        details,
        disclaimer: "File recognition does not guarantee launch success. Verify dependencies and DRM requirements."
      };
    }

    // Rule 2: Mobile PWA / iOS / Android checks
    if (hostOS === "ios" || hostOS === "android" || hostOS === "web") {
      if (sig.targetOS === "win32" || sig.targetOS === "darwin" || sig.targetOS === "linux") {
        status = "RED";
        headline = "Unsupported Natively on Mobile Browser — Use Remote Play";
        details.push(`${sig.type} cannot execute directly inside iOS Safari or Android mobile browsers.`);
        details.push("Use SmartBridge Remote Play to stream this game from a compatible host PC.");
        recommendedBridge = "remote";
      } else if ([".gba", ".gbc", ".gb", ".nes", ".sfc", ".smc"].includes(ext)) {
        status = "GREEN";
        headline = "Supported via Browser Emulation (EmulatorJS Compatible)";
        details.push("Lightweight 8-bit/16-bit/32-bit handheld/console ROMs can run in modern mobile browsers.");
        details.push("iOS Safari Note: Audio requires a screen tap to unlock WebAudio; performance depends on device thermal state.");
        recommendedBridge = "native";
        requiredRuntime = "Browser Core (EmulatorJS)";
      } else if (sig.targetOS === "emulated") {
        status = "YELLOW";
        headline = "Compatibility Warning — Heavy Console Disc Image on Mobile";
        details.push(`${sig.type} requires heavy hardware acceleration not supported in mobile Safari PWAs.`);
        details.push("Recommended: Run via Desktop Emulator + SmartBridge Remote Play.");
        recommendedBridge = "remote";
      } else {
        status = "YELLOW";
        headline = "Compatibility Warning — Unverified Mobile Format";
        details.push("Mobile browsers enforce strict sandbox rules and cannot launch external native binaries.");
        recommendedBridge = "remote";
      }
    }
    // Rule 3: Desktop OS checks (win32, darwin, linux)
    else {
      if (sig.targetOS === "cross-platform") {
        status = "GREEN";
        headline = "Potentially Supported — Cross-Platform Runtime";
        details.push("Java archives (such as Minecraft Java Edition) run on Windows, macOS, and Linux when Java (JRE/JDK) is installed.");
        requiredRuntime = "Java Runtime Environment (JRE)";
        recommendedBridge = "native";
      } else if (sig.targetOS === hostOS) {
        status = "GREEN";
        headline = "Potentially Supported — Matches Host Operating System";
        details.push(`${sig.type} matches your ${hostOS} environment.`);
        details.push("Note: Commercial titles (e.g., GTA V, Palworld, ETS2) require their official launcher (Steam/Rockstar/Epic) and valid account licence.");
        recommendedBridge = "native";
      } else if (sig.targetOS === "emulated") {
        status = "YELLOW";
        headline = "Requires Configured Emulator — Verify Path & System Files";
        details.push(`Detected ${sig.type}. Configure ${requiredRuntime} in Emulator Manager to launch.`);
        recommendedBridge = "native";
      } else if (sig.targetOS === "win32" && (hostOS === "linux" || hostOS === "darwin")) {
        status = "YELLOW";
        headline = "Compatibility Warning — Windows Binary on Non-Windows OS";
        details.push("Requires SmartBridge Compatibility Mode (Wine / Proton / CrossOver / Whisky) or Remote Play.");
        requiredRuntime = hostOS === "linux" ? "Wine / Proton" : "Wine / Game Porting Toolkit";
        recommendedBridge = "compat";
      } else if (sig.targetOS === "darwin" && hostOS !== "darwin") {
        status = "RED";
        headline = "Unsupported — macOS-Only Application";
        details.push("macOS .app/.dmg binaries cannot run natively on Windows or Linux. Use Remote Play from a Mac host.");
        recommendedBridge = "remote";
      } else if (sig.targetOS === "linux" && hostOS === "win32") {
        status = "YELLOW";
        headline = "Compatibility Warning — Linux Binary on Windows";
        details.push("Requires WSL2 with WSLg or a Linux Virtual Machine, or check if a native Windows build exists.");
        requiredRuntime = "WSL2 / Native Windows Build";
        recommendedBridge = "compat";
      } else {
        status = "YELLOW";
        headline = "Compatibility Warning — Manual Launch Configuration Required";
        details.push("Custom directory or unrecognized extension. Verify launch arguments before starting.");
        recommendedBridge = "native";
      }
    }

    if (totalRamGB && totalRamGB < 8 && (ext === ".exe" || ext === ".pkg" || ext === ".iso")) {
      if (status === "GREEN") status = "YELLOW";
      details.push(`Low System RAM detected (${totalRamGB} GB). Modern PC titles and PS3/PS4/Switch emulation typically require 8–16 GB+ RAM.`);
    }

    return {
      status,
      headline,
      executableType: sig.type,
      targetOS: sig.targetOS,
      hostOS,
      arch,
      ramInfo: totalRamGB ? `${totalRamGB} GB` : "Unavailable in Sandbox",
      storageInfo: freeStorageGB ? `${freeStorageGB} GB free` : "Unavailable in Sandbox",
      requiredRuntime,
      recommendedBridge,
      details,
      disclaimer: "SmartCheck verifies file metadata and OS architecture. It never guarantees a game will run or bypasses third-party DRM/licences."
    };
  }

  /**
   * SmartBridge Command Builder
   */
  function buildLaunchPlan(game, mode, emulatorConfig, compatToolPath) {
    const ext = getExtension(game.fileName || game.filePath);
    const sig = FILE_SIGNATURES[ext] || {};

    if (mode === "remote") {
      return {
        mode: "Remote Play",
        executable: game.remoteUrl || "https://moonlight-stream.org",
        args: [],
        summary: game.remoteUrl
          ? `Opening Remote Play stream session: ${game.remoteUrl}`
          : "Remote Play requires a host PC running Sunshine/Moonlight, Steam Link, or Parsec. Configure your Host Stream URL in Game Settings."
      };
    }

    if (sig.targetOS === "emulated" || game.emulatorId) {
      const emuId = game.emulatorId || sig.emulator || "retroarch";
      const emuDef = EMULATORS[emuId];
      const emuPath = (emulatorConfig && emulatorConfig[emuId]?.path) || "";
      const customCore = (emulatorConfig && emulatorConfig[emuId]?.corePath) || "";

      if (!emuPath) {
        return {
          error: true,
          message: `Emulator path for ${emuDef ? emuDef.name : emuId} is not set. Open Emulator Manager and select your installed emulator executable.`
        };
      }

      const rawArgs = (emuDef?.defaultArgs || ["{rom}"]).map((arg) =>
        arg
          .replace("{rom}", game.filePath)
          .replace("{core}", customCore || "SELECT_CORE_IN_EMULATOR")
      );

      return {
        mode: "Emulator Launch",
        executable: emuPath,
        args: rawArgs,
        summary: `Launching via ${emuDef ? emuDef.name : emuId}`
      };
    }

    if (mode === "compat") {
      const runner = compatToolPath || "wine";
      return {
        mode: "Compatibility Mode",
        executable: runner,
        args: [game.filePath],
        summary: `Launching via Compatibility Layer (${runner})`
      };
    }

    // Native Launch
    if (ext === ".jar") {
      return {
        mode: "Native Java Launch",
        executable: "java",
        args: ["-jar", game.filePath],
        summary: "Launching Java Archive with system JRE"
      };
    }

    return {
      mode: "Native Launch",
      executable: game.filePath,
      args: game.customArgs ? game.customArgs.split(" ").filter(Boolean) : [],
      summary: "Launching executable directly on host OS"
    };
  }

  return {
    EMULATORS,
    FILE_SIGNATURES,
    getExtension,
    formatBytes,
    runSmartCheck,
    buildLaunchPlan
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = NEXVION_CORE;
}
