
"use strict";

/* =========================
   ASSET URLS (GitHub Pages safe + keep ?v=... for cache)
========================= */
function getBaseUrl() {
  const path = location.pathname.endsWith("/")
    ? location.pathname
    : location.pathname.replace(/[^/]+$/, "");
  return `${location.origin}${path}`;
}

const BASE_URL = getBaseUrl();
const V = new URLSearchParams(location.search).get("v") || "";

function withV(url) {
  if (!V) return url;
  return url.includes("?") ? `${url}&v=${encodeURIComponent(V)}` : `${url}?v=${encodeURIComponent(V)}`;
}

function imgUrl(cardId) {
  return withV(`${BASE_URL}${cardId}.png`);
}

function jsonUrl(name) {
  return withV(`${BASE_URL}${name}`);
}

/* =========================
   DOM
========================= */
const listView = document.getElementById("listView");
const cardView = document.getElementById("cardView");
const backBtn = document.getElementById("backBtn");
const title = document.getElementById("title");

const cardList = document.getElementById("cardList");
const descTab = document.getElementById("descTab");

const desktopCardList = document.getElementById("desktopCardList");
const desktopTree = document.getElementById("desktopTree");

const treeBtn = document.getElementById("treeBtn");
const drawerTree = document.getElementById("drawerTree");
const mobileTree = document.getElementById("mobileTree");

let cards = [];
let currentCardId = null;

let selectedNodes = new Set();

/* =========================
   FIXED GRID 9 x 6
========================= */
const GRID_COLS = 9;
const GRID_ROWS = 6;

/* =========================
   HELPERS
========================= */
function flipRow(row) {
  return GRID_ROWS - row + 1;
}

function byId(id) {
  return cards.find((c) => String(c.id) === String(id));
}

function getLinks(card) {
  return Array.isArray(card.links) ? card.links : [];
}

function isDesktop() {
  return window.matchMedia("(min-width: 920px)").matches;
}

function firstNLinks(cardId, n) {
  const card = byId(cardId);
  if (!card) return [];
  return getLinks(card).slice(0, n);
}

/* =========================
   LIST RENDER
========================= */
function renderMobileList() {
  if (!cardList) return;
  cardList.innerHTML = "";
  cards.forEach((card) => {
    const div = document.createElement("div");
    div.className = "card-item";
    div.innerHTML = `<h4>${card.title}</h4>`;
    div.onclick = () => openCard(card.id);
    cardList.appendChild(div);
  });
}

function renderDesktopList() {
  if (!desktopCardList) return;
  desktopCardList.innerHTML = "";
  cards.forEach((card) => {
    const row = document.createElement("div");
    row.className =
      "sidebar-item" +
      (String(card.id) === String(currentCardId) ? " active" : "");
    row.innerHTML = `<span>${card.title}</span><span class="badge">#${card.id}</span>`;
    row.onclick = () => openCard(card.id);
    desktopCardList.appendChild(row);
  });
}

/* =========================
   CARD RENDER (ONLY PNG)
========================= */
function renderCardMobile(card) {
  if (!descTab) return;
  descTab.innerHTML = `
    <img src="${imgUrl(card.id)}" class="card-image-large" alt="">
  `;
}

/* =========================
   FIXED TREE LAYOUT BUILDER (9x6)
========================= */
function buildFixedTreeLayout(rootId) {
  const nodes = [];

  function place(cardId, col, row, branch = null, parentId = null) {
    const card = byId(cardId);
    if (!card) {
      console.warn("[DATA] missing card id:", cardId);
      return;
    }

    nodes.push({
      card,
      col,
      row: flipRow(row),
      branch,
      parentId,
    });
  }

  // --- Level 1 (root) ---
  place(rootId, 5, 6, null);

  // --- Level 2 ---
  const L2_POS = [
    { col: 2, row: 5 },
    { col: 5, row: 5 },
    { col: 8, row: 5 },
  ];

  const l2 = firstNLinks(rootId, 3);

  l2.forEach((id, i) => {
    place(id, L2_POS[i].col, L2_POS[i].row, i, rootId);
  });

  // --- Level 3 ---
  const L3_POS = [
    [{ col: 1, row: 4 }, { col: 2, row: 4 }, { col: 3, row: 4 }],
    [{ col: 4, row: 4 }, { col: 5, row: 4 }, { col: 6, row: 4 }],
    [{ col: 7, row: 4 }, { col: 8, row: 4 }, { col: 9, row: 4 }],
  ];

  const l3 = [];

  l2.forEach((parentId, branch) => {
    const kids = firstNLinks(parentId, 3);
    kids.forEach((id, i) => {
      const pos = L3_POS[branch][i];
      place(id, pos.col, pos.row, branch, parentId);
      l3.push({ id, col: pos.col, branch });
    });
  });

  // --- Level 4 ---
  const L4_ROWS = [3, 2, 1];

  l3.forEach(({ id, col, branch }) => {
    const kids = firstNLinks(id, 3);
    kids.forEach((kidId, i) => {
      place(kidId, col, L4_ROWS[i], branch, id);
    });
  });

  return nodes;
}

/* =========================
   PREVIEW HELPERS (desktop hover + mobile long-press)
========================= */
function attachPreviewHandlers(nodeDiv) {
  // Desktop: подстраховка (CSS hover тоже есть)
  nodeDiv.addEventListener("pointerenter", () => {
    if (isDesktop()) nodeDiv.classList.add("preview-open");
  });
  nodeDiv.addEventListener("pointerleave", () => {
    if (isDesktop()) nodeDiv.classList.remove("preview-open");
  });

  // Mobile: long press
  let t = null;
  const OPEN_DELAY = 350;

  nodeDiv.addEventListener("touchstart", () => {
    if (isDesktop()) return;
    clearTimeout(t);
    t = setTimeout(() => nodeDiv.classList.add("preview-open"), OPEN_DELAY);
  }, { passive: true });

  nodeDiv.addEventListener("touchend", () => {
    if (isDesktop()) return;
    clearTimeout(t);
    nodeDiv.classList.remove("preview-open");
  }, { passive: true });

  nodeDiv.addEventListener("touchmove", () => {
    if (isDesktop()) return;
    clearTimeout(t);
    nodeDiv.classList.remove("preview-open");
  }, { passive: true });
}

/* =========================
   TREE RENDER
========================= */
function renderTree(container) {
  if (!container) return;

  container.innerHTML = "";
  if (!currentCardId) return;

  const nodes = buildFixedTreeLayout(currentCardId);

  nodes.forEach(({ card, col, row, branch, parentId }) => {
    const div = document.createElement("div");
    div.className = "grid-node";

    // Цвета веток + root
    if (col === 5 && row === 1) div.classList.add("root");
    if (branch !== null) div.classList.add(`branch-${branch}`);

    if (selectedNodes.has(card.id)) div.classList.add("selected");

    div.style.gridColumnStart = col;
    div.style.gridRowStart = row;

    div.innerHTML = `<span class="node-title">${card.title}</span>`;
    div.dataset.id = String(card.id);
    div.dataset.col = String(col);
    div.dataset.row = String(row);
    div.dataset.parent = parentId == null ? "" : String(parentId);

    // PREVIEW
    const previewDiv = document.createElement("div");
    previewDiv.className = "card-preview";
    previewDiv.innerHTML = `<img src="${imgUrl(card.id)}" alt="${card.title}">`;
    div.appendChild(previewDiv);

    attachPreviewHandlers(div);

    // CLICK SELECT LOGIC (как было)
    div.onclick = (e) => {
      e.stopPropagation();

      const col = Number(div.dataset.col);
      const row = Number(div.dataset.row);

      // корень не кликаем
      if (col === 5 && row === 1) return;

      // LEVEL 2 — одиночный выбор
      if (row === 2) {
        // снять выбор уровня 3 и 4 при смене уровня 2
        const selectedL3 = container.querySelectorAll('.grid-node.selected[data-row="3"]');
        selectedL3.forEach((node) => {
          node.classList.remove("selected");
          selectedNodes.delete(node.dataset.id);
        });

        const selectedL4 = container.querySelectorAll(".grid-node.selected[data-row]");
        selectedL4.forEach((node) => {
          if (Number(node.dataset.row) >= 4) {
            node.classList.remove("selected");
            selectedNodes.delete(node.dataset.id);
          }
        });

        // снять старый выбор уровня 2
        const oldL2 = container.querySelector('.grid-node.selected[data-row="2"]');
        if (oldL2 && oldL2 !== div) {
          oldL2.classList.remove("selected");
          selectedNodes.delete(oldL2.dataset.id);
        }

        // переключатель
        if (div.classList.contains("selected")) {
          div.classList.remove("selected");
          selectedNodes.delete(card.id);
        } else {
          div.classList.add("selected");
          selectedNodes.add(card.id);
        }
        return;
      }

      // LEVEL 3 — одиночный выбор
      if (row === 3) {
        const selectedL2 = container.querySelector('.grid-node.selected[data-row="2"]');
        if (!selectedL2) return;

        // нельзя выбирать чужую ветку
        if (div.dataset.parent !== selectedL2.dataset.id) return;

        // снять все 4-е уровни при смене 3-го
        const selectedL4 = container.querySelectorAll(".grid-node.selected[data-row]");
        selectedL4.forEach((node) => {
          if (Number(node.dataset.row) >= 4) {
            node.classList.remove("selected");
            selectedNodes.delete(node.dataset.id);
          }
        });

        // снять старый выбор уровня 3
        const oldL3 = container.querySelector('.grid-node.selected[data-row="3"]');
        if (oldL3 && oldL3 !== div) {
          oldL3.classList.remove("selected");
          selectedNodes.delete(oldL3.dataset.id);
        }

        // переключатель
        if (div.classList.contains("selected")) {
          div.classList.remove("selected");
          selectedNodes.delete(card.id);
        } else {
          div.classList.add("selected");
          selectedNodes.add(card.id);
        }
        return;
      }

      // LEVEL 4 — одиночный выбор в столбце
      if (row >= 4) {
        const selectedL3 = container.querySelector('.grid-node.selected[data-row="3"]');
        if (!selectedL3) return;

        const selectedL3Col = Number(selectedL3.dataset.col);
        if (selectedL3Col !== col) return;

        // снять старый выбор 4-го уровня в этом столбце
        const selectedInColumn = container.querySelectorAll(`.grid-node.selected[data-col="${col}"]`);
        selectedInColumn.forEach((node) => {
          if (Number(node.dataset.row) >= 4) {
            node.classList.remove("selected");
            selectedNodes.delete(node.dataset.id);
          }
        });

        // переключатель
        if (div.classList.contains("selected")) {
          div.classList.remove("selected");
          selectedNodes.delete(card.id);
        } else {
          div.classList.add("selected");
          selectedNodes.add(card.id);
        }
        return;
      }
    };

    container.appendChild(div);
  });
}

/* =========================
   OPEN CARD
========================= */
function openCard(cardId) {
  const card = byId(cardId);
  if (!card) return;

  currentCardId = card.id;
  if (title) title.textContent = card.title;

  if (isDesktop()) {
    if (backBtn) backBtn.classList.add("hidden");
    if (treeBtn) treeBtn.classList.add("hidden");
  } else {
    if (listView) listView.classList.remove("active");
    if (cardView) cardView.classList.add("active");
    if (backBtn) backBtn.classList.remove("hidden");
    if (treeBtn) treeBtn.classList.remove("hidden");
    renderCardMobile(card);
  }

  renderDesktopList();
  renderTree(desktopTree);
  if (!isDesktop()) renderTree(mobileTree);
}

/* =========================
   NAV
========================= */
if (backBtn) {
  backBtn.onclick = () => {
    if (cardView) cardView.classList.remove("active");
    if (listView) listView.classList.add("active");
    backBtn.classList.add("hidden");
    if (treeBtn) treeBtn.classList.add("hidden");
  };
}

if (treeBtn) {
  treeBtn.onclick = () => drawerTree && drawerTree.classList.add("open");
}

document.addEventListener("click", (e) => {
  const key = e.target?.getAttribute("data-close");
  if (key) document.getElementById(key)?.classList.remove("open");
});

/* =========================
   INIT
========================= */
fetch(jsonUrl("cards.json"))
  .then((r) => r.json())
  .then((data) => {
    cards = data;
    renderMobileList();
    renderDesktopList();
    if (cards.length > 0) openCard(cards[0].id);
  })
  .catch((err) => console.error("[INIT] cards.json load failed:", err));

window.addEventListener("resize", () => {
  if (!currentCardId) return;
  openCard(currentCardId);
});
