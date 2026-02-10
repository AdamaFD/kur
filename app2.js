// Простаяя SPA без фрейм.
// ПК: сайдбар + дерево + карта. Мобилка: список -> карта + drawer'ы.
/* =========================
   APP STATE + DOM REFS
   (замена всего старого JSысf)
========================= */
// Простая SPA без фреймворков.
// ПК: сайдбар + дерево + карта. Мобилка: список -> карта + drawer'ы.
/* =========================
   APP STATE + DOM REFS
   (замена всего старого JS)
========================= */
// Простая SPA без фреймворков.
// ПК: сайдбар + дерево + карта. Мобилка: список -> карта + drawer'ы.
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

let selectedNodes = new Set();



let selectedByColumn = {}; 
// key = col, value = card.id
let selectedLevel3ByColumn = {}; 
// key = col, value = card.id




/* =========================
   FIXED GRID 9 x 6
========================= */
const GRID_COLS = 9;
const GRID_ROWS = 6;
const BRANCH_COLORS = [
  { light: "#d6f0ff", mid: "#6bbcff", dark: "#1e6fd9" }, // cyan → blue
  { light: "#daf5e6", mid: "#5ecf9a", dark: "#1f8f5f" }, // green
  { light: "#eadcff", mid: "#b18cff", dark: "#6b3fd6" }, // violet
];
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
========================= */
function buildFixedTreeLayout(rootId) {
  const nodes = [];

  function place(cardId, col, row, branch = null) {
    const card = byId(cardId);
    if (!card) return;

    nodes.push({
      card,
      col,
      row: flipRow(row),
      branch
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
    place(id, L2_POS[i].col, L2_POS[i].row, i); // branch = 0/1/2
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
      place(id, pos.col, pos.row, branch);
      l3.push({ id, col: pos.col, branch });
    });
  });

  // --- Level 4 ---
  const L4_ROWS = [3, 2, 1];

  l3.forEach(({ id, col, branch }) => {
    const kids = firstNLinks(id, 3);
    kids.forEach((kidId, i) => {
      place(kidId, col, L4_ROWS[i], branch);
    });
  });

  return nodes;
}



/* =========================
   TREE RENDER
========================= */






function renderTree(container) {
  container.innerHTML = "";
  if (!currentCardId) return;

  const nodes = buildFixedTreeLayout(currentCardId);

  nodes.forEach(({ card, col, row, branch }) => {
    const div = document.createElement("div");
    div.className = "grid-node";

    if (selectedNodes.has(card.id)) {
      div.classList.add("selected");
    }

    if (branch !== null) {
      div.dataset.branch = branch;
    }

    div.style.gridColumnStart = col;
div.style.gridRowStart = row;
div.innerHTML = `<span class="node-title">${card.title}</span>`;
div.dataset.id = card.id;
div.dataset.col = col;
div.dataset.row = row;


  div.onclick = (e) => {
  e.stopPropagation();

  const col = Number(div.dataset.col);
  const row = Number(div.dataset.row);

  // корень не кликаем
  if (col === 5 && row === 1) return;

  // =========================
  // LEVEL 2 — одиночный выбор
  // =========================
  if (row === 2) {
    // снять все выбранные на уровне 2, кроме текущего
    const selectedL2 = container.querySelectorAll('.grid-node.selected[data-row="2"]');
    selectedL2.forEach(node => {
      if (node !== div) {
        node.classList.remove("selected");
        selectedNodes.delete(node.dataset.id);
      }
    });

    // переключатель для текущего
    if (div.classList.contains("selected")) {
      div.classList.remove("selected");
      selectedNodes.delete(card.id);
    } else {
      div.classList.add("selected");
      selectedNodes.add(card.id);
    }

    return;
  }

  // =========================
  // LEVEL 3 — одиночный выбор, одна ветка
  // =========================
  if (row === 3) {
     // нельзя выбирать Level 3, если он не принадлежит выбранному Level 2
const selectedL2 = container.querySelector('.grid-node.selected[data-row="2"]');
if (selectedL2) {
  const parentId = selectedL2.dataset.id;
  const parentCard = byId(parentId);
  const allowedChildren = getLinks(parentCard);

  if (!allowedChildren.includes(card.id)) {
    return; // клик по чужой ветке — игнорируем
  }
}

    // снять все выбранные на уровне 3
    const selectedL3 = container.querySelectorAll('.grid-node.selected[data-row="3"]');
    selectedL3.forEach(node => {
      node.classList.remove("selected");
      selectedNodes.delete(node.dataset.id);
    });

    // если клик по уже выбранному — просто всё сняли и выходим
    if (div.classList.contains("selected")) {
      div.classList.remove("selected");
      selectedNodes.delete(card.id);

      // сбросить все 4-е уровни во всех столбцах
      const selectedL4All = container.querySelectorAll('.grid-node.selected');
      selectedL4All.forEach(node => {
        const r = Number(node.dataset.row);
        if (r >= 4) {
          node.classList.remove("selected");
          selectedNodes.delete(node.dataset.id);
        }
      });

      selectedLevel3ByColumn = {};
      return;
    }

    // выбрать текущий 3-й уровень
    div.classList.add("selected");
    selectedNodes.add(card.id);

    // одна активная ветка — очищаем и записываем только текущую
    selectedLevel3ByColumn = {};
    selectedLevel3ByColumn[col] = card.id;

    // при смене ветки — сбросить все 4-е уровни
    const selectedL4All = container.querySelectorAll('.grid-node.selected');
    selectedL4All.forEach(node => {
      const r = Number(node.dataset.row);
      if (r >= 4) {
        node.classList.remove("selected");
        selectedNodes.delete(node.dataset.id);
      }
    });

    return;
  }

  // =========================
  // LEVEL 4 — только если выбран LEVEL 3 в этом столбце
  // =========================
  if (row >= 4) {
    if (!selectedLevel3ByColumn[col]) return;

    // снять только 4-й уровень в этом столбце
    const selectedInColumn = container.querySelectorAll(
      `.grid-node.selected[data-col="${col}"]`
    );

    selectedInColumn.forEach(node => {
      const r = Number(node.dataset.row);
      if (r >= 4) {
        node.classList.remove("selected");
        selectedNodes.delete(node.dataset.id);
      }
    });

    // переключатель для текущего
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

window.addEventListener("resize", () => {
  if (!currentCardId) return;
  openCard(currentCardId);
});
