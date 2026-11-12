const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nexvionAPI", {
  getEnv: () => ipcRenderer.invoke("nexvion:get-env"),
  selectGameFile: () => ipcRenderer.invoke("nexvion:select-game-file"),
  selectGameFolder: () => ipcRenderer.invoke("nexvion:select-game-folder"),
  selectCover: () => ipcRenderer.invoke("nexvion:select-cover"),
  selectEmulator: () => ipcRenderer.invoke("nexvion:select-emulator"),
  verifyPaths: (paths) => ipcRenderer.invoke("nexvion:verify-paths", paths),
  openExternal: (url) => ipcRenderer.invoke("nexvion:open-external", url),
  launchGame: (payload) => ipcRenderer.invoke("nexvion:launch-game", payload)
});
