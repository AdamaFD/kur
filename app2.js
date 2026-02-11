// курлыки
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
const drawerTree = document.getElementById("drawerTree"); // Исправлено: было "document = document.getElementById"
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
  // Исходная ошибка: была дублирующаяся строка "desktopCard.innerHTML = `", это исправлено
  desktopCard.innerHTML = `
    <img src="${card.id}.png" alt="Изображение карты ${card.id}">
    <button class="open-pdf">Открыть карту (PDF)</button>
  `;
  const openPdfBtn = desktopCard.querySelector(".open-pdf");
  if (openPdfBtn) {
    openPdfBtn.onclick = () => window.open(`pdfs/${card.pdf}`, "_blank");
  }
}
function renderCardMobile(card) {
  descTab.innerHTML = `
    <img src="image/${card.id}.png" class="card-image-large" alt="Изображение карты ${card.id}">
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
  function place(cardId, col, row, branch = null, parentId = null) {
    const card = byId(cardId);
    if (!card) return;
    nodes.push({
      card,
      col,
      row: flipRow(row),
      branch,
      parentId
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
    // branch = 0/1/2
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
   TREE RENDER
========================= */
function renderTree(container) {
  container.innerHTML = "";
  if (!currentCardId) return;
  const nodes = buildFixedTreeLayout(currentCardId);
  nodes.forEach(({ card, col, row, branch, parentId }) => {
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
    // --- ИЗМЕНЕННАЯ ЧАСТЬ: ДОБАВЛЕНИЕ card-preview и img ---
    div.innerHTML = `
      <span class="node-title">${card.title}</span>
      <div class="card-preview">
        <img src="./${card.id}.png" alt="Предпросмотр карты ${card.id}">
      </div>
    `;
    // --- КОНЕЦ ИЗМЕНЕННОЙ ЧАСТИ ---
    div.dataset.id = card.id;
    div.dataset.col = col;
    div.dataset.row = row;
    div.dataset.parent = parentId; // теперь работает
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
        // снять выбор уровня 3 и 4 при смене уровня 2
        const selectedL3 = container.querySelectorAll('.grid-node.selected[data-row="3"]');
        selectedL3.forEach(node => {
          node.classList.remove("selected");
          selectedNodes.delete(node.dataset.id);
        });
        const selectedL4 = container.querySelectorAll('.grid-node.selected[data-row]');
        selectedL4.forEach(node => {
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
      // =========================
      // LEVEL 3 — одиночный выбор
      // =========================
      if (row === 3) {
        // нельзя выбирать Level 3 без выбранного Level 2
        const selectedL2 = container.querySelector('.grid-node.selected[data-row="2"]');
        if (!selectedL2) return;
        // нельзя выбирать Level 3, если он не принадлежит выбранному Level 2
        if (div.dataset.parent !== selectedL2.dataset.id) {
          return; // чужая ветка — игнор
        }
        // снять все 4-е уровни при смене 3-го
        const selectedL4 = container.querySelectorAll('.grid-node.selected[data-row]');
        selectedL4.forEach(node => {
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
      // =========================
      // LEVEL 4 — одиночный выбор в столбце
      // =========================
      if (row >= 4) {
        // нельзя выбирать 4-й уровень без выбранного 3-го
        const selectedL3 = container.querySelector('.grid-node.selected[data-row="3"]');
        if (!selectedL3) return;
        // 4-й уровень можно выбирать только в той же ветке (том же столбце)
        const selectedL3Col = Number(selectedL3.dataset.col);
        if (selectedL3Col !== col) return;
        // снять старый выбор 4-го уровня в этом столбце
        const selectedInColumn = container.querySelectorAll(
          `.grid-node.selected[data-col="${col}"]`
        );
        selectedInColumn.forEach(node => {
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
      }   // конец LEVEL 4
    };  // конец onclick
    container.appendChild(div);
  }); // конец nodes.forEach
}   // конец renderTree
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

// Исправлено: событие data-close должно срабатывать на закрытие drawerTree,
// а не на открытие, которое управляется treeBtn.
// Также добавлена логика для закрытия по клику на overlay.
document.addEventListener("click", (e) => {
  const key = e.target?.getAttribute("data-close");
  if (key) {
    const targetElement = document.getElementById(key);
    if (targetElement) {
      targetElement.setAttribute("aria-hidden", "true");
      document.body.classList.remove('drawer-open'); // Убрать класс для блокировки скролла
    }
  }
});

// Добавим обработчик для открытия drawerTree по кнопке treeBtn
if (treeBtn && drawerTree) {
  treeBtn.addEventListener('click', () => {
    drawerTree.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drawer-open'); // Добавить класс для блокировки скролла
    renderTree(mobileTree); // Рендерим дерево для мобильной версии при открытии
  });

  // Логика для закрытия drawerTree по клику на overlay
  const drawerOverlay = drawerTree.querySelector('.drawer-overlay');
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', () => {
      drawerTree.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('drawer-open');
    });
  }
}

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
