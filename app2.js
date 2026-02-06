"use strict";

// DOM References
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

// Constants
const GRID_COLS = 9;
const GRID_ROWS = 6;
let nodePositions = {}; // { cardId: { col, row } }

// Helper Functions
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

// Render List for Mobile
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

// Render List for Desktop
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

// Render Card (Desktop)
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

// Render Card (Mobile)
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

// CSS for Text Wrapping and Clamping
const styles = `
.grid-node .node-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;  /* Ограничение до двух строк */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
}
`;
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Build Tree Layout (9x6 Grid, with root at the top)
function buildFixedTreeLayout(rootId) {
  const positions = {};
  const nodesToRender = [];
  const used = new Set(); // чтобы не было дублей/наложений при повторяющихся id

  function place(cardId, col, row) {
    const card = byId(cardId);
    if (!card) return false;

    if (col < 1 || col > GRID_COLS || row < 1 || row > GRID_ROWS) return false;
    if (used.has(String(card.id))) return false;

    used.add(String(card.id));
    positions[card.id] = { col, row };
    nodesToRender.push(card.id);
    return true;
  }

  const root = byId(rootId);
  if (!root) return { positions, nodesToRender };
  place(root.id, 5, 1); // Root at (5,1) — в верхней части

  // Level 2 (Now placed below the root)
  const L2_POS = [
    { col: 2, row: 2 },
    { col: 5, row: 2 },
    { col: 8, row: 2 },
  ];
  const l2Ids = firstNLinks(root.id, 3);
  const l2Placed = [];
  l2Ids.forEach((id, i) => {
    const ok = place(id, L2_POS[i].col, L2_POS[i].row);
    if (ok) l2Placed[i] = String(id);
  });

  // Level 3 (Now placed below Level 2)
  const L3_POS_BY_BRANCH = [
    [
      { col: 2, row: 3 },
      { col: 3, row: 3 },
      { col: 4, row: 3 },
    ],
    [
      { col: 5, row: 3 },
      { col: 6, row: 3 },
      { col: 7, row: 3 },
    ],
    [
      { col: 8, row: 3 },
      { col: 9, row: 3 },
      { col: 10, row: 3 }, // Переходим на более правую часть, если нужно
    ],
  ];

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

  // Level 4 (Now placed below Level 3)
  const L4_ROWS = [4, 5, 6]; // Дочерние карты на 4, 5, 6 рядах
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

// Render Full Tree (Root on top)
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

    div.innerHTML = `<span class="node-title">${card.title}</span>`;
    div.onclick = () => openCard(card.id);

    container.appendChild(div);
  });
}

// Open Card
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
  renderTree




