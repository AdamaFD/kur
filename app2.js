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
/* =========================
   PAN/ZOOM for mobile drawer tree
========================= */
function enablePanZoomForMobileTree() {
  // только для мобилки
  if (isDesktop()) return;
  if (!mobileTree) return;

  // если уже обёрнуто — не делаем второй раз
  if (mobileTree.closest(".panzoom-viewport")) return;

  // ожидаем, что mobileTree находится в drawerPanel в блоке .tree
  const host = mobileTree.parentElement;
  if (!host) return;

  // создаём viewport + canvas
  const viewport = document.createElement("div");
  viewport.className = "panzoom-viewport";

  const canvas = document.createElement("div");
  canvas.className = "panzoom-canvas";

  // вставляем viewport на место mobileTree, а mobileTree переносим внутрь canvas
  host.replaceChild(viewport, mobileTree);
  viewport.appendChild(canvas);
  canvas.appendChild(mobileTree);

  let scale = 1;
  let tx = 0;
  let ty = 0;

  const MIN_SCALE = 0.6;
  const MAX_SCALE = 2.8;

  const pointers = new Map(); // pointerId -> {x,y}
  let startTx = 0, startTy = 0, startScale = 1;
  let startDist = 0, startMid = null;

  function apply() {
    canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // wheel zoom (если браузер на мобилке/тачпаде отдаёт wheel)
  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const delta = -e.deltaY;
    const zoomFactor = delta > 0 ? 1.08 : 0.92;

    const newScale = clamp(scale * zoomFactor, MIN_SCALE, MAX_SCALE);

    // зум относительно курсора
    tx = cx - ((cx - tx) * (newScale / scale));
    ty = cy - ((cy - ty) * (newScale / scale));
    scale = newScale;

    apply();
  }, { passive: false });

  viewport.addEventListener("pointerdown", (e) => {
    viewport.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    startTx = tx;
    startTy = ty;
    startScale = scale;

    if (pointers.size === 2) {
      const [p1, p2] = Array.from(pointers.values());
      startDist = dist(p1, p2);
      startMid = midpoint(p1, p2);
    }
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1) {
      // drag (панорамирование)
      const p = Array.from(pointers.values())[0];
      const first = { x: p.x, y: p.y };

      // найдём исходную точку pointerdown сложно без хранения; проще:
      // используем movementX/Y
      tx += e.movementX;
      ty += e.movementY;
      apply();
      return;
    }

    if (pointers.size === 2) {
      // pinch zoom + pan
      const [p1, p2] = Array.from(pointers.values());
      const newDist = dist(p1, p2);
      const newMid = midpoint(p1, p2);

      const factor = newDist / (startDist || newDist);
      const newScale = clamp(startScale * factor, MIN_SCALE, MAX_SCALE);

      // смещение по midpoint
      tx = startTx + (newMid.x - startMid.x);
      ty = startTy + (newMid.y - startMid.y);
      scale = newScale;

      apply();
    }
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) {
      startDist = 0;
      startMid = null;
      startScale = scale;
      startTx = tx;
      startTy = ty;
    }
  }

  viewport.addEventListener("pointerup", endPointer);
  viewport.addEventListener("pointercancel", endPointer);

  // double tap to reset (опционально)
  let lastTap = 0;
  viewport.addEventListener("pointerup", (e) => {
    const now = Date.now();
    if (now - lastTap < 280) {
      scale = 1;
      tx = 0;
      ty = 0;
      apply();
    }
    lastTap = now;
  });

  apply();
}

/* включаем pan/zoom при открытии шторки */
treeBtn.onclick = () => {
  drawerTree.classList.add("open");
  enablePanZoomForMobileTree();
};

window.addEventListener("resize", () => {
  if (!currentCardId) return;
  openCard(currentCardId);
});

