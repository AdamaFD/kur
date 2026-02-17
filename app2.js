"use strict";      //курлыкиииииии//

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

  nodes.forEach(({ card, col, row, branch }) => {
    const div = document.createElement("div");
    const nodeKey = `${col}-${row}`; // Уникальный ключ по координатам
    
    div.className = "grid-node";
    div.classList.add(`row-${row}`); 
    if (col === 5 && row === 1) div.classList.add("root");
    if (branch !== null) div.classList.add(`branch-${branch}`);
    
    // Проверка выбора по ключу координат
    if (selectedNodes.has(nodeKey)) div.classList.add("selected");

    div.style.gridColumnStart = col;
    div.style.gridRowStart = row;

    // Структура для сохранения превью и формы
    div.innerHTML = `
      <div class="node-shape"></div>
      <span class="node-title">${card.title}</span>
      <div class="card-preview"><img src="${imgUrl(card.id)}" alt=""></div>
    `;
    
    attachPreviewHandlers(div);

    div.onclick = (e) => {
      e.stopPropagation();

      // --- ЛОГИКА ВЫБОРА ПО КООРДИНАТАМ ---
      
      // УРОВЕНЬ 2 (Ряд 2)
      if (row === 2) {
        if (selectedNodes.has(nodeKey)) {
          selectedNodes.clear(); // Снимаем всё
        } else {
          selectedNodes.clear(); 
          selectedNodes.add(nodeKey); // Выбираем только этот узел
        }
      } 
      
      // УРОВЕНЬ 3 (Ряд 3)
      else if (row === 3) {
        // Находим координату родителя на 2 уровне
        let parentCol = col <= 3 ? 2 : (col <= 6 ? 5 : 8);
        if (!selectedNodes.has(`${parentCol}-2`)) return; // Нет активного родителя

        if (selectedNodes.has(nodeKey)) {
          selectedNodes.delete(nodeKey);
          // Снимаем выбор с его детей на 4 уровне (те же колонки, ряды 4-6)
          [4,5,6].forEach(r => selectedNodes.delete(`${col}-${r}`));
        } else {
          // Снимаем выбор с других L3 в этой ветке и их детей
          let branchStart = col <= 3 ? 1 : (col <= 6 ? 4 : 7);
          for(let c = branchStart; c < branchStart + 3; c++) {
            selectedNodes.delete(`${c}-3`);
            [4,5,6].forEach(r => selectedNodes.delete(`${c}-${r}`));
          }
          selectedNodes.add(nodeKey);
        }
      } 
      
      // УРОВЕНЬ 4 (Ряды 4, 5, 6 — Шестиугольники)
      else if (row >= 4) {
        if (!selectedNodes.has(`${col}-3`)) return; // Нет активного родителя на 3 уровне

        if (selectedNodes.has(nodeKey)) {
          selectedNodes.delete(nodeKey);
        } else {
          // Одиночный выбор в колонке (между рядами 4, 5, 6)
          [4,5,6].forEach(r => selectedNodes.delete(`${col}-${r}`));
          selectedNodes.add(nodeKey);
        }
      }

      renderTree(container); // Мгновенная перерисовка
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
