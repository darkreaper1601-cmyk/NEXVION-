const MOBILE_STORAGE_KEY = "nexvion_mobile_games_v1";
let mobileGames = JSON.parse(localStorage.getItem(MOBILE_STORAGE_KEY) || "[]");
let pickedFile = null;
let pickedCover = null;
let currentInspectId = null;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

function detectMobileEnv() {
  const ua = navigator.userAgent || "";
  let platform = "web";
  if (/iPhone|iPad|iPod/i.test(ua)) platform = "ios";
  else if (/Android/i.test(ua)) platform = "android";

  return {
    platform,
    arch: platform === "ios" ? "arm64 (Apple Silicon)" : "mobile",
    totalRamGB: navigator.deviceMemory || null,
    freeStorageGB: null
  };
}

const mobileEnv = detectMobileEnv();

document.querySelectorAll(".m-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".m-tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".m-view").forEach((v) => v.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`view-${tab.dataset.view}`).classList.add("active");
  });
});

function saveMobileGames() {
  localStorage.setItem(MOBILE_STORAGE_KEY, JSON.stringify(mobileGames));
}

function renderMobileLibrary() {
  const empty = document.getElementById("mEmptyState");
  const list = document.getElementById("mGamesList");

  if (!mobileGames.length) {
    empty.classList.remove("hidden");
    list.classList.add("hidden");
    list.innerHTML = "";
    return;
  }

  empty.classList.add("hidden");
  list.classList.remove("hidden");
  list.innerHTML = "";

  mobileGames.forEach((g) => {
    const check = NEXVION_CORE.runSmartCheck(g, mobileEnv);
    const card = document.createElement("div");
    card.className = "m-game-card";
    const bg = g.coverData ? `style="background-image:url('${g.coverData}')"` : "";
    card.innerHTML = `
      <div class="m-thumb" ${bg}>${g.coverData ? "" : g.name.slice(0, 2).toUpperCase()}</div>
      <div class="m-game-body">
        <div class="m-game-title">${g.name}</div>
        <div class="m-game-sub">${NEXVION_CORE.formatBytes(g.sizeBytes)} • <strong>${check.status}</strong></div>
        <button class="btn primary" data-id="${g.id}">SmartCheck &amp; Options</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", () => openMobileInspect(g.id));
    list.appendChild(card);
  });
}

function renderMobileEmulators() {
  const container = document.getElementById("mEmuList");
  container.innerHTML = "";
  Object.values(NEXVION_CORE.EMULATORS).forEach((emu) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${emu.name}</h3>
      <p class="muted" style="color:#a78bfa;margin:4px 0;">${emu.systems.join(", ")}</p>
      <p class="muted">${emu.notes}</p>
      <a href="${emu.website}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;color:#60a5fa;font-size:13px;">Official Website ↗</a>
    `;
    container.appendChild(div);
  });
}

// Add modal
const mAddModal = document.getElementById("mAddModal");
function openMobileAdd() {
  pickedFile = null;
  pickedCover = null;
  document.getElementById("mFileInput").value = "";
  document.getElementById("mFileInfo").textContent = "No file chosen";
  document.getElementById("mGameName").value = "";
  document.getElementById("mRemoteUrl").value = "";
  mAddModal.classList.remove("hidden");
}

document.getElementById("btnAddMobile").addEventListener("click", openMobileAdd);
document.getElementById("btnEmptyAddMobile").addEventListener("click", openMobileAdd);
document.getElementById("mCancelAdd").addEventListener("click", () => mAddModal.classList.add("hidden"));

document.getElementById("mFileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  pickedFile = file;
  document.getElementById("mFileInfo").textContent = `${file.name} (${NEXVION_CORE.formatBytes(file.size)})`;
  if (!document.getElementById("mGameName").value) {
    document.getElementById("mGameName").value = file.name.replace(/\.[^/.]+$/, "");
  }
});

document.getElementById("mCoverInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    pickedCover = reader.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById("mSaveGame").addEventListener("click", () => {
  const name = document.getElementById("mGameName").value.trim();
  if (!pickedFile || !name) {
    alert("Please pick a game file and enter a name.");
    return;
  }

  mobileGames.push({
    id: Date.now().toString(),
    name,
    fileName: pickedFile.name,
    filePath: pickedFile.name,
    sizeBytes: pickedFile.size,
    coverData: pickedCover,
    remoteUrl: document.getElementById("mRemoteUrl").value.trim()
  });

  saveMobileGames();
  mAddModal.classList.add("hidden");
  renderMobileLibrary();
});

// Inspect modal
const mInspectModal = document.getElementById("mInspectModal");
function openMobileInspect(id) {
  currentInspectId = id;
  const game = mobileGames.find((g) => g.id === id);
  if (!game) return;

  const check = NEXVION_CORE.runSmartCheck(game, mobileEnv);
  document.getElementById("mInspTitle").textContent = game.name;
  const badge = document.getElementById("mBadge");
  badge.className = `badge status-${check.status}`;
  badge.textContent = `${check.status}: ${check.headline}`;

  document.getElementById("mDetails").innerHTML = check.details.map((d) => `<li>${d}</li>`).join("");
  document.getElementById("mSpecs").innerHTML = `
    <strong>File Type:</strong> ${check.executableType}<br/>
    <strong>Device OS:</strong> ${check.hostOS} (${check.arch})<br/>
    <strong>Runtime:</strong> ${check.requiredRuntime}<br/>
    <em>${check.disclaimer}</em>
  `;

  mInspectModal.classList.remove("hidden");
}

document.getElementById("mBtnCloseInspect").addEventListener("click", () => mInspectModal.classList.add("hidden"));

document.getElementById("mBtnBrowserPlay").addEventListener("click", () => {
  const game = mobileGames.find((g) => g.id === currentInspectId);
  if (!game) return;
  const ext = NEXVION_CORE.getExtension(game.fileName);
  if ([".gba", ".gbc", ".gb", ".nes", ".sfc", ".smc"].includes(ext)) {
    alert("Compatible retro ROM detected! Connect an open-source EmulatorJS instance or load your local ROM file into a WebAssembly retro core.");
  } else {
    alert("Mobile browser sandbox cannot directly execute desktop binaries (.exe/.app/.iso). Use Remote Play instead.");
  }
});

document.getElementById("mBtnRemotePlay").addEventListener("click", () => {
  const game = mobileGames.find((g) => g.id === currentInspectId);
  if (!game) return;
  const url = game.remoteUrl || "https://moonlight-stream.org";
  window.open(url, "_blank", "noopener");
});

document.getElementById("mBtnDelete").addEventListener("click", () => {
  mobileGames = mobileGames.filter((g) => g.id !== currentInspectId);
  saveMobileGames();
  mInspectModal.classList.add("hidden");
  renderMobileLibrary();
});

renderMobileLibrary();
renderMobileEmulators();
