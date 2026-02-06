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
"use strict";

// Настройки сетки
const GRID_COLS = 9;
const GRID_ROWS = 6;
let nodePositions = {}; // Для хранения позиций узлов

// Вспомогательная функция для получения карты по ID
function byId(id) {
  return cards.find((c) => String(c.id) === String(id));
}

// Построение макета дерева
function buildFixedTreeLayout(rootId) {
  const positions = {};
  const nodesToRender = [];
  const used = new Set(); // Для предотвращения дублей узлов

  function place(cardId, col, row) {
    const card = byId(cardId);
    if (!card || col < 1 || col > GRID_COLS || row < 1 || row > GRID_ROWS || used.has(String(card.id))) {
      return false;
    }

    used.add(String(card.id));
    positions[card.id] = { col, row };
    nodesToRender.push(card.id);
    return true;
  }

  // Уровень 1 (корень)
  const root = byId(rootId);
  if (root) {
    place(root.id, 5, 1);  // Корень на позиции (5, 1)
  }

  // Уровень 2
  const L2_POS = [
    { col: 2, row: 2 },
    { col: 5, row: 2 },
    { col: 8, row: 2 },
  ];

  const l2Ids = firstNLinks(rootId, 3);
  const l2Placed = [];
  l2Ids.forEach((id, i) => {
    if (place(id, L2_POS[i].col, L2_POS[i].row)) {
      l2Placed[i] = String(id);
    }
  });

  // Уровень 3 (ветви)
  const L3_POS_BY_BRANCH = [
    [
      { col: 1, row: 3 },
      { col: 2, row: 3 },
      { col: 3, row: 3 },
    ],
    [
      { col: 4, row: 3 },
      { col: 5, row: 3 },
      { col: 6, row: 3 },
    ],
    [
      { col: 7, row: 3 },
      { col: 8, row: 3 },
      { col: 9, row: 3 },
    ],
  ];

  const l3ByCol = new Map();
  for (let branchIndex = 0; branchIndex < 3; branchIndex++) {
    const parentL2 = l2Placed[branchIndex];
    if (parentL2) {
      const kids = firstNLinks(parentL2, 3);
      kids.forEach((kidId, j) => {
        const pos = L3_POS_BY_BRANCH[branchIndex][j];
        if (place(kidId, pos.col, pos.row)) {
          l3ByCol.set(pos.col, String(kidId));
        }
      });
    }
  }

  // Уровень 4 (вертикально вниз для каждого столбца)
  const L4_ROWS = [4, 5, 6];
  for (let col = 1; col <= 9; col++) {
    const l3Id = l3ByCol.get(col);
    if (l3Id) {
      const kids = firstNLinks(l3Id, 3);
      kids.forEach((kidId, k) => {
        place(kidId, col, L4_ROWS[k]);
      });
    }
  }

  return { positions, nodesToRender };
}

// Рендеринг дерева
function renderTree(container) {
  container.innerHTML = "";
  if (!currentCardId) return;

  const { positions, nodesToRender } = buildFixedTreeLayout(currentCardId);
  nodePositions = positions;

  nodesToRender.forEach((id) => {
    const card = byId(id);
    const pos = positions[id];
    if (card && pos) {
      const div = document.createElement("div");
      div.className = "grid-node";
      div.style.gridColumnStart = pos.col;
      div.style.gridRowStart = pos.row;

      // Заголовок внутри узла, с переносом текста
      div.innerHTML = `<span class="node-title">${card.title}</span>`;
      div.onclick = () => openCard(card.id);

      container.appendChild(div);
    }
  });
}

// Открытие выбранной карты
function openCard(cardId) {
  const card = byId(cardId);
  if (!card) return;

  currentCardId = card.id;
  title.textContent = card.title;

  renderDesktopList();
  renderTree(desktopTree);
  if (!isDesktop()) renderTree(mobileTree);
}

// Дополнительная логика для навигации и отображения
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

// Инициализация
fetch("cards.json")
  .then((r) => r.json())
  .then((data) => {
    cards = data;

    renderMobileList();
    renderDesktopList();

    if (cards.length > 0) openCard(cards[0].id);
  });






