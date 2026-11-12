const STORAGE_KEYS = {
  GAMES: "nexvion_desktop_games_v1",
  EMULATORS: "nexvion_desktop_emulators_v1",
  COMPAT: "nexvion_desktop_compat_v1"
};

let games = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAMES) || "[]");
let emulatorConfig = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMULATORS) || "{}");
let compatToolPath = localStorage.getItem(STORAGE_KEYS.COMPAT) || "";
let hostEnv = { platform: "unknown", arch: "unknown" };
let draftGame = null;
let selectedGameId = null;

function saveState() {
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
  localStorage.setItem(STORAGE_KEYS.EMULATORS, JSON.stringify(emulatorConfig));
  localStorage.setItem(STORAGE_KEYS.COMPAT, compatToolPath);
}

// Navigation Tabs
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

// Initialize Environment & Render
async function init() {
  hostEnv = await window.nexvionAPI.getEnv();
  document.getElementById("envSummary").textContent =
    `OS: ${hostEnv.platform} (${hostEnv.arch}) • RAM: ${hostEnv.totalRamGB} GB • Free: ${hostEnv.freeStorageGB || "?"} GB`;

  document.getElementById("compatPathInput").value = compatToolPath;
  await verifyAllFiles(false);
  renderLibrary();
  renderEmulators();
}

async function verifyAllFiles(showAlert = true) {
  if (!games.length) return;
  const paths = games.map((g) => g.filePath);
  const statusMap = await window.nexvionAPI.verifyPaths(paths);
  let missingCount = 0;
  games = games.map((g) => {
    const exists = Boolean(statusMap[g.filePath]);
    if (!exists) missingCount++;
    return { ...g, fileMissing: !exists };
  });
  saveState();
  renderLibrary();
  if (showAlert) {
    alert(
      missingCount === 0
        ? "All imported game files and folders were verified on disk."
        : `Warning: ${missingCount} game(s) could not be found at their saved locations.`
    );
  }
}

function renderLibrary() {
  const emptyEl = document.getElementById("emptyState");
  const gridEl = document.getElementById("gamesGrid");

  if (!games.length) {
    emptyEl.classList.remove("hidden");
    gridEl.classList.add("hidden");
    gridEl.innerHTML = "";
    return;
  }

  emptyEl.classList.add("hidden");
  gridEl.classList.remove("hidden");
  gridEl.innerHTML = "";

  games.forEach((game) => {
    const check = NEXVION_CORE.runSmartCheck(game, hostEnv);
    const card = document.createElement("div");
    card.className = "game-card";

    const coverStyle = game.coverData ? `style="background-image: url('${game.coverData}')"` : "";
    const initials = game.coverData ? "" : (game.name || "NV").slice(0, 2).toUpperCase();

    card.innerHTML = `
      <div class="game-cover" ${coverStyle}>
        ${initials}
        <span class="status-pill status-${check.status}">${check.status}</span>
      </div>
      <div class="game-info">
        <div>
          <div class="game-title">${escapeHtml(game.name)}</div>
          <div class="game-meta">
            <strong>Size:</strong> ${NEXVION_CORE.formatBytes(game.sizeBytes)}<br/>
            <strong>Path:</strong> ${escapeHtml(game.filePath)}<br/>
            ${game.fileMissing ? "<span style='color:#fca5a5;'>⚠ File Missing on Disk</span>" : ""}
          </div>
        </div>
        <button class="btn primary" data-inspect="${game.id}">SmartCheck &amp; Launch</button>
      </div>
    `;

    card.querySelector("[data-inspect]").addEventListener("click", () => openInspectModal(game.id));
    gridEl.appendChild(card);
  });
}

function renderEmulators() {
  const container = document.getElementById("emulatorList");
  container.innerHTML = "";

  Object.values(NEXVION_CORE.EMULATORS).forEach((emu) => {
    const saved = emulatorConfig[emu.id] || {};
    const card = document.createElement("div");
    card.className = "emu-card";
    card.innerHTML = `
      <h3>${emu.name}</h3>
      <div class="emu-systems">Systems: ${emu.systems.join(", ")}</div>
      <p class="emu-notes">${emu.notes}</p>
      <label style="font-size:12px;color:#9ca3af;">Installed Executable Path</label>
      <div class="inline-form">
        <input type="text" readonly value="${escapeHtml(saved.path || "")}" placeholder="Not configured" />
        <button class="btn secondary" data-browse="${emu.id}">Browse</button>
      </div>
      ${
        emu.id === "retroarch"
          ? `<div class="inline-form">
               <input type="text" data-core="${emu.id}" value="${escapeHtml(saved.corePath || "")}" placeholder="Optional Libretro Core path (.dll / .so / .dylib)" />
             </div>`
          : ""
      }
      <div class="inline-form" style="margin-top:12px;">
        <button class="btn secondary" data-site="${emu.website}">Official Website</button>
      </div>
    `;

    card.querySelector(`[data-browse="${emu.id}"]`).addEventListener("click", async () => {
      const selected = await window.nexvionAPI.selectEmulator();
      if (selected) {
        emulatorConfig[emu.id] = { ...(emulatorConfig[emu.id] || {}), path: selected };
        saveState();
        renderEmulators();
      }
    });

    const coreInput = card.querySelector(`[data-core="${emu.id}"]`);
    if (coreInput) {
      coreInput.addEventListener("change", (e) => {
        emulatorConfig[emu.id] = { ...(emulatorConfig[emu.id] || {}), corePath: e.target.value.trim() };
        saveState();
      });
    }

    card.querySelector(`[data-site="${emu.website}"]`).addEventListener("click", () => {
      window.nexvionAPI.openExternal(emu.website);
    });

    container.appendChild(card);
  });
}

// Add Game Modal Handlers
const addModal = document.getElementById("addModal");
function openAddModal() {
  draftGame = { coverData: null, sizeBytes: 0, filePath: "", fileName: "" };
  document.getElementById("inpFilePath").value = "";
  document.getElementById("inpGameName").value = "";
  document.getElementById("inpEmulator").value = "";
  document.getElementById("inpCustomArgs").value = "";
  document.getElementById("inpRemoteUrl").value = "";
  document.getElementById("lblFileSize").textContent = "Size: —";
  document.getElementById("lblFileType").textContent = "Type: —";
  document.getElementById("lblCoverStatus").textContent = "No custom cover selected";
  addModal.classList.remove("hidden");
}

function closeAddModal() {
  addModal.classList.add("hidden");
}

document.getElementById("btnOpenAddModal").addEventListener("click", openAddModal);
document.getElementById("btnEmptyAdd").addEventListener("click", openAddModal);
document.getElementById("btnCloseAddModal").addEventListener("click", closeAddModal);
document.getElementById("btnCancelAdd").addEventListener("click", closeAddModal);
document.getElementById("btnVerifyFiles").addEventListener("click", () => verifyAllFiles(true));

document.getElementById("btnPickFile").addEventListener("click", async () => {
  const res = await window.nexvionAPI.selectGameFile();
  if (!res) return;
  draftGame = { ...draftGame, ...res };
  applyPickedTarget(res);
});

document.getElementById("btnPickFolder").addEventListener("click", async () => {
  const res = await window.nexvionAPI.selectGameFolder();
  if (!res) return;
  draftGame = { ...draftGame, ...res };
  applyPickedTarget(res);
});

function applyPickedTarget(res) {
  document.getElementById("inpFilePath").value = res.filePath;
  document.getElementById("lblFileSize").textContent = `Size: ${NEXVION_CORE.formatBytes(res.sizeBytes)}`;
  const ext = NEXVION_CORE.getExtension(res.fileName);
  const sig = NEXVION_CORE.FILE_SIGNATURES[ext];
  document.getElementById("lblFileType").textContent = `Type: ${sig ? sig.type : "Folder / Custom"}`;
  if (!document.getElementById("inpGameName").value) {
    document.getElementById("inpGameName").value = res.fileName.replace(/\.[^/.]+$/, "");
  }
}

document.getElementById("btnPickCover").addEventListener("click", async () => {
  const dataUrl = await window.nexvionAPI.selectCover();
  if (dataUrl) {
    draftGame.coverData = dataUrl;
    document.getElementById("lblCoverStatus").textContent = "Custom cover loaded ✓";
  }
});

document.getElementById("btnSaveGame").addEventListener("click", () => {
  const name = document.getElementById("inpGameName").value.trim();
  const filePath = document.getElementById("inpFilePath").value.trim();
  if (!filePath || !name) {
    alert("Please select a game file or folder and enter a game name.");
    return;
  }

  games.push({
    id: Date.now().toString(),
    name,
    filePath,
    fileName: draftGame.fileName || name,
    sizeBytes: draftGame.sizeBytes || 0,
    coverData: draftGame.coverData || null,
    emulatorId: document.getElementById("inpEmulator").value,
    customArgs: document.getElementById("inpCustomArgs").value.trim(),
    remoteUrl: document.getElementById("inpRemoteUrl").value.trim(),
    fileMissing: false
  });

  saveState();
  closeAddModal();
  renderLibrary();
});

// SmartCheck & Launch Modal
const inspectModal = document.getElementById("inspectModal");
function openInspectModal(gameId) {
  selectedGameId = gameId;
  const game = games.find((g) => g.id === gameId);
  if (!game) return;

  const check = NEXVION_CORE.runSmartCheck(game, hostEnv);
  document.getElementById("inspTitle").textContent = `${game.name} — SmartCheck`;
  const badge = document.getElementById("smartBadge");
  badge.className = `smart-badge status-${check.status}`;
  badge.textContent = `${check.status}: ${check.headline}`;

  const list = document.getElementById("smartDetails");
  list.innerHTML = check.details.map((d) => `<li>${escapeHtml(d)}</li>`).join("");

  document.getElementById("smartSpecs").innerHTML = `
    <strong>Executable Type:</strong> ${check.executableType}<br/>
    <strong>Target OS:</strong> ${check.targetOS} | <strong>Host OS:</strong> ${check.hostOS} (${check.arch})<br/>
    <strong>System RAM:</strong> ${check.ramInfo} | <strong>Free Storage:</strong> ${check.storageInfo}<br/>
    <strong>Required Runtime:</strong> ${check.requiredRuntime}<br/>
    <em>${check.disclaimer}</em>
  `;

  document.getElementById("launchFeedback").textContent = "";
  inspectModal.classList.remove("hidden");
}

document.getElementById("btnCloseInspect").addEventListener("click", () => inspectModal.classList.add("hidden"));
document.getElementById("btnDoneInspect").addEventListener("click", () => inspectModal.classList.add("hidden"));

async function triggerLaunch(mode) {
  const game = games.find((g) => g.id === selectedGameId);
  if (!game) return;
  const feedback = document.getElementById("launchFeedback");
  feedback.textContent = "Routing launch through SmartBridge...";
  const res = await window.nexvionAPI.launchGame({
    game,
    mode,
    emulatorConfig,
    compatToolPath
  });
  feedback.style.color = res.ok ? "#6ee7b7" : "#fca5a5";
  feedback.textContent = res.message;
}

document.getElementById("btnLaunchNative").addEventListener("click", () => triggerLaunch("native"));
document.getElementById("btnLaunchCompat").addEventListener("click", () => triggerLaunch("compat"));
document.getElementById("btnLaunchRemote").addEventListener("click", () => triggerLaunch("remote"));

document.getElementById("btnRemoveGame").addEventListener("click", () => {
  if (!selectedGameId) return;
  games = games.filter((g) => g.id !== selectedGameId);
  saveState();
  inspectModal.classList.add("hidden");
  renderLibrary();
});

document.getElementById("btnSaveCompat").addEventListener("click", () => {
  compatToolPath = document.getElementById("compatPathInput").value.trim();
  saveState();
  alert("Compatibility layer path saved.");
});

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

init();
