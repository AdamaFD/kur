"use strict";

/**
 * BASE URL:
 * На GitHub Pages /kur/ корректно соберётся как "https://adamafd.github.io/kur/"
 * и мы к нему прилепим "1.png", "pdfs/....pdf" и т.д.
 */
function getBaseUrl() {
  // location.pathname может быть "/kur/" или "/kur/index.html"
  const path = location.pathname.endsWith("/")
    ? location.pathname
    : location.pathname.replace(/[^/]+$/, "");
  return `${location.origin}${path}`;
}

const BASE_URL = getBaseUrl();
const V = new URLSearchParams(location.search).get("v") || ""; // cache buster

function withV(url) {
  if (!V) return url;
  return url.includes("?") ? `${url}&v=${encodeURIComponent(V)}` : `${url}?v=${encodeURIComponent(V)}`;
}

function imgUrl(id) {
  return withV(`${BASE_URL}${id}.png`);
}

function pdfUrl(pdfFile) {
  return withV(`${BASE_URL}pdfs/${pdfFile}`);
}

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
let selectedNodes = new Set();

const GRID_ROWS = 6;

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
   CARD RENDER
========================= */
function renderCardDesktop(card) {
  if (!desktopCard) return;
  desktopCard.innerHTML = `
    <img src="${imgUrl(card.id)}" alt="">
    <button class="open-pdf">Открыть карту (PDF)</button>
  `;
  const openPdfBtn = desktopCard.querySelector(".open-pdf");
  if (openPdfBtn) {
    openPdfBtn.onclick = () => window.open(pdfUrl(card.pdf), "_blank");
  }
}

function renderCardMobile(card) {
  if (!descTab) return;
  descTab.innerHTML = `
    <img src="${imgUrl(card.id)}" class="card-image-large">
    <button class="open-pdf">Открыть карту</button>
  `;
  const openPdfBtn = descTab.querySelector(".open-pdf");
  if (openPdfBtn) {
    openPdfBtn.onclick = () => window.open(pdfUrl(card.pdf), "_blank");
  }
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
    nodes.push({ card, col, row: flipRow(row), branch, parentId });
  }

  // Level 1 (root)
  place(rootId, 5, 6, null, null);

  // Level 2 positions
  const L2_POS = [
    { col: 2, row: 5 },
    { col: 5, row: 5 },
    { col: 8, row: 5 },
  ];
  const l2 = firstNLinks(rootId, 3);
  l2.forEach((id, i) => place(id, L2_POS[i].col, L2_POS[i].row, i, rootId));

  // Level 3 positions
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

  // Level 4 rows
  const L4_ROWS = [3, 2, 1];
  l3.forEach(({ id, col, branch }) => {
    const kids = firstNLinks(id, 3);
    kids.forEach((kidId, i) => place(kidId, col, L4_ROWS[i], branch, id));
  });

  return nodes;
}

/* =========================
   PREVIEW HANDLERS (desktop hover + mobile long-press)
========================= */
function attachPreviewHandlers(nodeDiv) {
  // Desktop: просто чтобы класс был (можно не обязательно, но ок)
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

    div.style.gridColumnStart = col;
    div.style.gridRowStart = row;

    div.dataset.id = String(card.id);
    div.dataset.col = String(col);
    div.dataset.row = String(row);
    div.dataset.parent = parentId == null ? "" : String(parentId);

    // root class
    if (col === 5 && row === 1) div.classList.add("root");
    if (selectedNodes.has(card.id)) div.classList.add("selected");

    div.innerHTML = `<span class="node-title">${card.title}</span>`;

    // preview
    const previewDiv = document.createElement("div");
    previewDiv.className = "card-preview";
    previewDiv.innerHTML = `<img src="${imgUrl(card.id)}" alt="${card.title}">`;
    div.appendChild(previewDiv);

    attachPreviewHandlers(div);

    div.addEventListener("click", (e) => {
      e.stopPropagation();

      const c = Number(div.dataset.col);
      const r = Number(div.dataset.row);

      // root not clickable
      if (c === 5 && r === 1) return;

      // toggle selection simple (твой старый “умный выбор” можно вернуть потом)
      div.classList.toggle("selected");
      if (div.classList.contains("selected")) selectedNodes.add(card.id);
      else selectedNodes.delete(card.id);
    });

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
    renderCardDesktop(card);
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
  treeBtn.onclick = () => {
    if (drawerTree) drawerTree.classList.add("open");
  };
}

document.addEventListener("click", (e) => {
  const key = e.target?.getAttribute("data-close");
  if (key) document.getElementById(key)?.classList.remove("open");
});

/* =========================
   INIT
========================= */
fetch(withV(`${BASE_URL}cards.json`))
  .then((r) => r.json())
  .then((data) => {
    cards = data;
    renderMobileList();
    renderDesktopList();
    if (cards.length > 0) openCard(cards[0].id);
  })
  .catch((err) => console.error("[INIT] failed to load cards.json:", err));

window.addEventListener("resize", () => {
  if (!currentCardId) return;
  openCard(currentCardId);
});
