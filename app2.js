// Простая SPA без фреймворков.
// ПК: сайдбар + дерево + карта. Мобилка: список -> карта + drawer'ы.
/* =========================
   APP STATE + DOM REFS
   (замена всего старого JS)
========================= */
"use strict";

const listView = document.getElementById("listView");
const cardView = document.getElementById("cardView");
const backBtn = document.getElementById("backBtn");
const title = document.getElementById("title");

const cardList = document.getElementById("cardList");
const descTab = document.getElementById("descTab");

const desktopCardList = document.getElementById("desktopCardList");
const desktopTree = document.getElementById("desktopTree");
const desktopCard = document.getElementById("desktopCard");

const treeBtn = document.getElementById("treeBtn");
const drawerTree = document.getElementById("drawerTree");
const mobileTree = document.getElementById("mobileTree");

let cards = [];
let currentCardId = null;

/* =========================
   FIXED GRID 9 x 6
========================= */
const GRID_COLS = 9;
const GRID_ROWS = 6;

let nodePositions = {}; // { cardId: { col, row } }

/* =========================
   HELPERS
========================= */
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
   CARD RENDER
========================= */
function renderCardDesktop(card) {
  desktopCard.innerHTML = `
    <img src="images/${card.id}.jpg" alt="">
    <button class="open-pdf">Открыть карту (PDF)</button>
  `;
  const openPdfBtn = desktopCard.querySelector(".open-pdf");
  if (openPdfBtn) {
    openPdfBtn.onclick = () => window.open(`pdfs/${card.pdf}`, "_blank");
  }
}

function renderCardMobile(card) {
  descTab.innerHTML = `
    <img src="images/${card.id}.jpg" class="card-image-large">
    <button class="open-pdf">Открыть карту</button>
  `;
  const openPdfBtn = descTab.querySelector(".open-pdf");
  if (openPdfBtn) {
    openPdfBtn.onclick = () => window.open(`pdfs/${card.pdf}`, "_blank");
  }
}

/* =========================
   FIXED TREE LAYOUT BUILDER (9x6)
   Схема строго по твоим координатам:
   L1: root (5,6)
   L2: (2,5) (5,5) (8,5)
   L3: левая (1,4)(2,4)(3,4), средняя (4,4)(5,4)(6,4), правая (7,4)(8,4)(9,4)
   L4: для каждого узла в row=4 (X,4) дети: (X,3)(X,2)(X,1)
========================= */
function buildFixedTreeLayout(rootId) {
  const positions = {};
  const nodesToRender = [];

  const used = new Set(); // чтобы не было дублей/наложений при повторяющихся id

  function place(cardId, col, row) {
    const card = byId(cardId);
    if (!card) return false;

    // границы сетки
    if (col < 1 || col > GRID_COLS || row < 1 || row > GRID_ROWS) return false;

    // если этот id уже размещен — пропускаем (иначе один и тот же узел окажется в разных местах)
    if (used.has(String(card.id))) return false;

    used.add(String(card.id));
    positions[card.id] = { col, row };
    nodesToRender.push(card.id);
    return true;
  }

  // --- Level 1 ---
  const root = byId(rootId);
  if (!root) return { positions, nodesToRender };

  place(root.id, 5, 6);

  // --- Level 2 ---
  const L2_POS = [
    { col: 2, row: 5 },
    { col: 5, row: 5 },
    { col: 8, row: 5 },
  ];

  const l2Ids = firstNLinks(root.id, 3);
  const l2Placed = []; // [id,id,id] (только реально размещенные)

  l2Ids.forEach((id, i) => {
    const ok = place(id, L2_POS[i].col, L2_POS[i].row);
    if (ok) l2Placed[i] = String(id);
  });

  // --- Level 3 ---
  const L3_POS_BY_BRANCH = [
    [
      { col: 1, row: 4 },
      { col: 2, row: 4 },
      { col: 3, row: 4 },
    ],
    [
      { col: 4, row: 4 },
      { col: 5, row: 4 },
      { col: 6, row: 4 },
    ],
    [
      { col: 7, row: 4 },
      { col: 8, row: 4 },
      { col: 9, row: 4 },
    ],
  ];

  // сохраним л3 узлы по колонкам, чтобы потом построить l4 в столбик
  // key: col -> cardId
  const l3ByCol = new Map();

  for (let branchIndex = 0; branchIndex < 3; branchIndex++) {
    const parentL2 = l2Placed[branchIndex];
    if (!parentL2) continue;

    const kids = firstNLinks(parentL2, 3);
    kids.forEach((kidId, j) => {
      const pos = L3_POS_BY_BRANCH[branchIndex][j];
      const ok = place(kidId, pos.col, pos.row);
      if (ok) l3ByCol.set(pos.col, String(kidId));
    });
  }

  // --- Level 4 (вертикально 3 вниз для каждой колонки X, где есть узел на (X,4)) ---
  const L4_ROWS = [3, 2, 1];

  for (let col = 1; col <= 9; col++) {
    const l3Id = l3ByCol.get(col);
    if (!l3Id) continue;

    const kids = firstNLinks(l3Id, 3);
    kids.forEach((kidId, k) => {
      place(kidId, col, L4_ROWS[k]);
    });
  }

  return { positions, nodesToRender };
}

/* =========================
   TREE RENDER (целое дерево)
   - показывает дерево целиком по фиксированной схеме
   - клик по узлу делает его новым root (можно отключить)
========================= */
function renderTree(container) {
  container.innerHTML = "";
  if (!currentCardId) return;

  const { positions, nodesToRender } = buildFixedTreeLayout(currentCardId);
  nodePositions = positions;

  nodesToRender.forEach((id) => {
    const card = byId(id);
    const pos = positions[id];
    if (!card || !pos) return;

    const div = document.createElement("div");
    div.className = "grid-node";
    div.style.gridColumnStart = pos.col;
    div.style.gridRowStart = pos.row;

    // title внутри span — чтобы у тебя CSS мог ограничить в 2 строки (line-clamp)
    div.innerHTML = `<span class="node-title">${card.title}</span>`;

    // Клик по любому узлу: сделать его корнем дерева
    div.onclick = () => openCard(card.id);

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
  title.textContent = card.title;

  if (isDesktop()) {
    backBtn.classList.add("hidden");
    treeBtn.classList.add("hidden");
    renderCardDesktop(card);
  } else {
    listView.classList.remove("active");
    cardView.classList.add("active");
    backBtn.classList.remove("hidden");
    treeBtn.classList.remove("hidden");
    renderCardMobile(card);
  }

  renderDesktopList();
  renderTree(desktopTree);
  if (!isDesktop()) renderTree(mobileTree);
}

/* =========================
   NAV
========================= */
backBtn.onclick = () => {
  cardView.classList.remove("active");
  listView.classList.add("active");
  backBtn.classList.add("hidden");
  treeBtn.classList.add("hidden");
};

treeBtn.onclick = () => drawerTree.classList.add("open");

document.addEventListener("click", (e) => {
  const key = e.target?.getAttribute("data-close");
  if (key) document.getElementById(key).classList.remove("open");
});

/* =========================
   INIT
========================= */
fetch("cards.json")
  .then((r) => r.json())
  .then((data) => {
    cards = data;

    renderMobileList();
    renderDesktopList();

    if (cards.length > 0) openCard(cards[0].id);
  });

/* (опционально) при ресайзе перерисовать дерево/карточку под режим */
window.addEventListener("resize", () => {
  if (!currentCardId) return;
  openCard(currentCardId);
});





