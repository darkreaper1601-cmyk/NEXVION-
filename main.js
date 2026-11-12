const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");
const NEXVION_CORE = require("../shared/core.js");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#090814",
    title: "NEXVION — Universal Game Launcher",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Get System Environment for SmartCheck
ipcMain.handle("nexvion:get-env", async () => {
  let freeStorageGB = null;
  try {
    const stats = fs.statfsSync(os.homedir());
    freeStorageGB = ((stats.bfree * stats.bsize) / (1024 ** 3)).toFixed(1);
  } catch (e) {
    freeStorageGB = null;
  }

  return {
    platform: process.platform,
    arch: process.arch,
    totalRamGB: (os.totalmem() / (1024 ** 3)).toFixed(1),
    freeStorageGB,
    hostname: os.hostname()
  };
});

// Select Game File
ipcMain.handle("nexvion:select-game-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select Legally Obtained Game File or ROM",
    properties: ["openFile"],
    filters: [
      {
        name: "Games & ROMs",
        extensions: [
          "exe", "app", "AppImage", "sh", "jar", "bat",
          "gba", "gbc", "gb", "nes", "sfc", "smc", "n64", "z64",
          "iso", "chd", "cso", "rvz", "wbfs", "wua", "rpx", "nsp", "xci", "pkg"
        ]
      },
      { name: "All Files", extensions: ["*"] }
    ]
  });

  if (result.canceled || !result.filePaths.length) return null;
  const filePath = result.filePaths[0];
  const stat = fs.statSync(filePath);
  return {
    filePath,
    fileName: path.basename(filePath),
    sizeBytes: stat.size,
    isDirectory: stat.isDirectory()
  };
});

// Select Game Folder
ipcMain.handle("nexvion:select-game-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select Game Installation Folder",
    properties: ["openDirectory"]
  });

  if (result.canceled || !result.filePaths.length) return null;
  const folderPath = result.filePaths[0];
  return {
    filePath: folderPath,
    fileName: path.basename(folderPath),
    sizeBytes: 0,
    isDirectory: true
  };
});

// Select Custom Cover Image
ipcMain.handle("nexvion:select-cover", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select Custom Cover Image",
    properties: ["openFile"],
    filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }]
  });

  if (result.canceled || !result.filePaths.length) return null;
  const imgPath = result.filePaths[0];
  const ext = path.extname(imgPath).slice(1) || "png";
  const base64 = fs.readFileSync(imgPath).toString("base64");
  return `data:image/${ext};base64,${base64}`;
});

// Select Emulator Executable
ipcMain.handle("nexvion:select-emulator", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Locate Installed Emulator Executable",
    properties: ["openFile"]
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

// Check if paths exist (Missing File Detector)
ipcMain.handle("nexvion:verify-paths", async (_event, paths) => {
  const statusMap = {};
  for (const p of paths) {
    statusMap[p] = p ? fs.existsSync(p) : false;
  }
  return statusMap;
});

// Open external official links safely
ipcMain.handle("nexvion:open-external", async (_event, url) => {
  if (typeof url === "string" && (url.startsWith("https://") || url.startsWith("http://"))) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

// SmartBridge Launch Execution
ipcMain.handle("nexvion:launch-game", async (_event, payload) => {
  const { game, mode, emulatorConfig, compatToolPath } = payload;

  if (mode === "remote") {
    const targetUrl = game.remoteUrl || "https://moonlight-stream.org";
    await shell.openExternal(targetUrl);
    return { ok: true, message: `Opened Remote Play target: ${targetUrl}` };
  }

  if (!game.filePath || !fs.existsSync(game.filePath)) {
    return { ok: false, message: "Game file or directory is missing at the configured path." };
  }

  const plan = NEXVION_CORE.buildLaunchPlan(game, mode, emulatorConfig, compatToolPath);
  if (plan.error) {
    return { ok: false, message: plan.message };
  }

  try {
    // If user imported a directory directly in native mode, open folder
    if (fs.statSync(plan.executable).isDirectory()) {
      await shell.openPath(plan.executable);
      return { ok: true, message: "Opened game installation folder." };
    }

    const child = spawn(plan.executable, plan.args, {
      detached: true,
      stdio: "ignore",
      cwd: path.dirname(plan.executable)
    });
    child.unref();
    return { ok: true, message: `${plan.summary} (${path.basename(plan.executable)})` };
  } catch (err) {
    return { ok: false, message: `Launch failed: ${err.message}` };
  }
});
