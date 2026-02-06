"use strict";

/* =========================
   APP STATE + DOM REFS
   (Полная замена всего старого JS)
========================= */
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

let cards = []; // Массив с вашими данными карт, загружается из cards.json
let currentCardId = null; // ID текущей выбранной карты

/* =========================
   FIXED GRID DIMENSIONS
========================= */
const GRID_COLS = 9;
const GRID_ROWS = 6;

/* =========================
   HELPERS
========================= */
/**
 * Находит карту по ее ID в массиве `cards`.
 * @param {string | number} id - ID карты.
 * @returns {object | undefined} Объект карты или undefined, если не найдена.
 */
function byId(id) {
  return cards.find((c) => String(c.id) === String(id));
}

/**
 * Получает массив ссылок (ID дочерних карт) для заданной карты.
 * @param {string | number} cardId - ID родительской карты.
 * @returns {string[]} Массив ID дочерних карт.
 */
function getLinks(cardId) {
  const card = byId(cardId);
  return card && Array.isArray(card.links) ? card.links.map(String) : [];
}

/**
 * Определяет, является ли текущее устройство десктопом (ширина экрана >= 920px).
 * @returns {boolean} True, если десктоп, иначе False.
 */
function isDesktop() {
  return window.matchMedia("(min-width: 920px)").matches;
}

/**
 * Возвращает N первых ссылок (ID дочерних карт) для заданной карты.
 * @param {string | number} cardId - ID родительской карты.
 * @param {number} n - Максимальное количество ссылок для возврата.
 * @returns {string[]} Массив ID первых N дочерних карт.
 */
function firstNLinks(cardId, n) {
  const links = getLinks(cardId);
  return links.slice(0, n);
}

/* =========================
   LIST RENDER FUNCTIONS
========================= */
/**
 * Рендерит список карт для мобильной версии.
 */
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

/**
 * Рендерит список карт для десктопной версии (sidebar).
 * Выделяет текущую выбранную карту.
 */
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
   CARD RENDER FUNCTIONS
========================= */
/**
 * Рендерит детальную информацию о карте для десктопной версии.
 * @param {object} card - Объект карты.
 */
function renderCardDesktop(card) {
  desktopCard.innerHTML = `
    <img src="images/${card.id}.jpg" alt="${card.title}">
    <button class="open-pdf">Открыть карту (PDF)</button>
  `;
  const openPdfBtn = desktopCard.querySelector(".open-pdf");
  if (openPdfBtn && card.pdf) { // Проверяем наличие PDF
    openPdfBtn.onclick = () => window.open(`pdfs/${card.pdf}`, "_blank");
  } else if (openPdfBtn) {
    openPdfBtn.style.display = 'none'; // Скрываем кнопку, если PDF нет
  }
}

/**
 * Рендерит детальную информацию о карте для мобильной версии.
 * @param {object} card - Объект карты.
 */
function renderCardMobile(card) {
  descTab.innerHTML = `
    <img src="images/${card.id}.jpg" class="card-image-large" alt="${card.title}">
    <button class="open-pdf">Открыть карту</button>
  `;
  const openPdfBtn = descTab.querySelector(".open-pdf");
  if (openPdfBtn && card.pdf) { // Проверяем наличие PDF
    openPdfBtn.onclick = () => window.open(`pdfs/${card.pdf}`, "_blank");
  } else if (openPdfBtn) {
    openPdfBtn.style.display = 'none'; // Скрываем кнопку, если PDF нет
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
/**
 * Строит фиксированную схему дерева на сетке 9x6.
 * @param {string | number} rootId - ID корневой карты.
 * @returns {{positions: object, nodesToRender: string[]}} Объект с позициями карт и списком ID карт для рендера.
 */
function buildFixedTreeLayout(rootId) {
  const positions = {};
  const visited = new Set(); // Для предотвращения циклов и дублирования

  /**
   * Размещает карту на указанных координатах сетки.
   * @param {string | number} cardId - ID карты.
   * @param {number} col - Номер колонки (от 1 до GRID_COLS).
   * @param {number} row - Номер ряда (от 1 до GRID_ROWS).
   * @returns {boolean} True, если карта успешно размещена, иначе False.
   */
  function place(cardId, col, row) {
    const card = byId(cardId);
    // Если карта не найдена, или уже размещена, или координаты вне сетки
    if (!card || visited.has(String(cardId)) || col < 1 || col > GRID_COLS || row < 1 || row > GRID_ROWS) {
      return false;
    }

    visited.add(String(cardId));
    positions[cardId] = { col, row };
    return true;
  }

  // --- Level 1 (Root) ---
  const root = byId(rootId);
  if (!root) return { positions, nodesToRender: [] }; // Если корень не найден, ничего не рендерим

  place(root.id, 5, 6); // Корень на (5,6)

  // --- Level 2 (Дети корня) ---
  const L2_POS = [
    { col: 2, row: 5 },
    { col: 5, row: 5 },
    { col: 8, row: 5 },
  ];

  const l2Ids = firstNLinks(root.id, 3); // Получаем до 3х ссылок на детей
  const l2Placed = []; // Хранит ID реально размещенных карт 2-го уровня

  l2Ids.forEach((id, i) => {
    // Проверяем, что есть место для размещения (не более 3х)
    if (i < L2_POS.length) {
      const ok = place(id, L2_POS[i].col, L2_POS[i].row);
      if (ok) l2Placed[i] = String(id);
    }
  });

  // --- Level 3 (Дети карт 2-го уровня) ---
  const L3_POS_BY_BRANCH = [
    // Позиции для детей левой ветки L2 (на 2,5)
    [
      { col: 1, row: 4 },
      { col: 2, row: 4 },
      { col: 3, row: 4 },
    ],
    // Позиции для детей средней ветки L2 (на 5,5)
    [
      { col: 4, row: 4 },
      { col: 5, row: 4 },
      { col: 6, row: 4 },
    ],
    // Позиции для детей правой ветки L2 (на 8,5)
    [
      { col: 7, row: 4 },
      { col: 8, row: 4 },
      { col: 9, row: 4 },
    ],
  ];

  // l3ByCol: { col: cardId } - для удобства построения 4-го уровня
  const l3ByCol = new Map();

  for (let branchIndex = 0; branchIndex < 3; branchIndex++) {
    const parentL2 = l2Placed[branchIndex];
    if (!parentL2) continue; // Если карта L2 не была размещена, пропускаем её ветку

    const kids = firstNLinks(parentL2, 3); // Получаем до 3х ссылок
    kids.forEach((kidId, j) => {
      // Проверяем, что есть место для размещения (не более 3х в ветке)
      if (j < L3_POS_BY_BRANCH[branchIndex].length) {
        const pos = L3_POS_BY_BRANCH[branchIndex][j];
        const ok = place(kidId, pos.col, pos.row);
        if (ok) l3ByCol.set(pos.col, String(kidId));
      }
    });
  }

  // --- Level 4 (Дети карт 3-го уровня - вертикально в столбик) ---
  const L4_ROWS = [3, 2, 1]; // Позиции рядов для детей в столбике (самый верх - row 1)

  for (let col = 1; col <= 9; col++) { // Проходим по всем колонкам
    const l3Id = l3ByCol.get(col);
    if (!l3Id) continue; // Если в этой колонке нет карты 3-го уровня, пропускаем

    const kids = firstNLinks(l3Id, 3); // Получаем до 3х ссылок
    kids.forEach((kidId, k) => {
      // Проверяем, что есть место для размещения (не более 3х в столбике)
      if (k < L4_ROWS.length) {
        place(kidId, col, L4_ROWS[k]);
      }
    });
  }

  // Возвращаем все уникальные ID, которые были успешно размещены
  return { positions, nodesToRender: Array.from(visited) };
}


/* =========================
   TREE RENDER (Использует buildFixedTreeLayout)
   ========================= */
/**
 * Рендерит дерево карт в указанном HTML-контейнере.
 * @param {HTMLElement} containerElement - DOM-элемент, в который будет рендериться дерево.
 * @param {string | number} rootCardId - ID корневой карты для построения дерева.
 */
function renderTree(containerElement, rootCardId) {
  containerElement.innerHTML = ""; // Очищаем контейнер

  const { positions, nodesToRender } = buildFixedTreeLayout(rootCardId);

  // Создаем и размещаем узлы
  nodesToRender.forEach(cardId => {
    const pos = positions[cardId];
    if (pos) {
      const card = byId(cardId);
      if (!card) return; // На всякий случай, если карта не найдена

      const nodeDiv = document.createElement("div");
      nodeDiv.className = "grid-node";
      nodeDiv.dataset.cardId = card.id;

      // title внутри span — чтобы CSS мог применить line-clamp
      const titleSpan = document.createElement("span");
      titleSpan.className = "node-title";
      titleSpan.textContent = card.title; // Или card.name, смотря какое поле у вас для названия
      nodeDiv.appendChild(titleSpan);

      nodeDiv.style.gridColumn = pos.col;
      nodeDiv.style.gridRow = pos.row;

      // Добавляем классы locked/active-choice, если они есть в данных карты
      // (Предполагается, что эти свойства есть в вашем cards.json)
      if (card.locked) nodeDiv.classList.add("locked");
      if (card.activeChoice) nodeDiv.classList.add("active-choice");
      
      // Клик по любому узлу: сделать его корнем дерева и обновить отображение
      nodeDiv.addEventListener("click", (e) => {
        // Останавливаем распространение события, чтобы не закрылась шторка при клике на узел в мобильной версии
        e.stopPropagation(); 
        openCard(card.id);
        if (!isDesktop()) {
            // Если на мобилке, закрываем шторку после выбора карты
            drawerTree.classList.remove("open");
        }
      });

      containerElement.appendChild(nodeDiv);
    }
  });
}

/* =========================
   OPEN CARD (обновлена для рендера дерева)
========================= */
/**
 * Открывает детальное представление карты и обновляет все связанные элементы (списки, деревья).
 * @param {string | number} cardId - ID карты для открытия.
 */
function openCard(cardId) {
  const card = byId(cardId);
  if (!card) return;

  currentCardId = card.id;
  title.textContent = card.title;

  if (isDesktop()) {
    backBtn.classList.add("hidden");
    treeBtn.classList.add("hidden"); // Скрываем кнопку дерева на десктопе, если она не нужна
    renderCardDesktop(card);
  } else {
    listView.classList.remove("active");
    cardView.classList.add("active");
    backBtn.classList.remove("hidden");
    treeBtn.classList.remove("hidden"); // Показываем кнопку дерева на мобилке
    renderCardMobile(card);
  }

  renderDesktopList(); // Всегда обновляем список на десктопе

  // Рендерим дерево
  if (desktopTree) {
    renderTree(desktopTree, currentCardId);
  }
  if (mobileTree) {
      // Для мобильного дерева нам нужен pan/zoom, поэтому рендер немного отличается
      // Он будет вызван при открытии шторки, но мы можем его вызвать и здесь,
      // если mobileTree уже виден или нужен пред-рендер
      // Однако, обычно мобильное дерево рендерится только при открытии шторки,
      // т.к. оно находится внутри panzoom-canvas
      if (drawerTree.classList.contains("open")) { // Если шторка уже открыта, перерисовываем
        renderTree(mobileTree, currentCardId);
      }
  }
}

/* =========================
   NAV & DRAWER LOGIC
========================= */
backBtn.onclick = () => {
  cardView.classList.remove("active");
  listView.classList.add("active");
  backBtn.classList.add("hidden");
  treeBtn.classList.add("hidden");
  title.textContent = "Список карт"; // Или другое название для списка
};

treeBtn.onclick = () => {
  drawerTree.classList.add("open");
  // При открытии шторки с деревом, рендерим его и включаем pan/zoom
  if (mobileTree && currentCardId) {
      renderTree(mobileTree, currentCardId);
      enablePanZoomForMobileTree(); // Включаем pan/zoom
  }
};

// Обработчик для закрытия drawer'ов по клику на оверлей или элемент с data-close
document.addEventListener("click", (e) => {
  const target = e.target;
  const dataCloseKey = target.getAttribute("data-close");

  if (dataCloseKey) {
    const elementToClose = document.getElementById(dataCloseKey);
    if (elementToClose) {
      elementToClose.classList.remove("open");
    }
  } else if (target.classList.contains("drawer-overlay")) {
    // Если кликнули по оверлею, закрываем открытые drawer'ы
    document.querySelectorAll(".drawer.open").forEach(drawer => {
      drawer.classList.remove("open");
    });
  }
});


/* =========================
   PAN/ZOOM for mobile drawer tree
   (Включен только для #mobileTree в шторке)
========================= */
/**
 * Включает функциональность панорамирования и масштабирования для дерева в мобильной шторке.
 */
function enablePanZoomForMobileTree() {
  // Только для мобилки
  if (isDesktop()) return;
  if (!mobileTree) return;

  // Если уже обёрнуто — не делаем второй раз
  if (mobileTree.closest(".panzoom-viewport")) return;

  // Ожидаем, что mobileTree находится в drawerPanel в блоке .tree
  const host = mobileTree.parentElement;
  if (!host) return;

  // Создаём viewport + canvas
  const viewport = document.createElement("div");
  viewport.className = "panzoom-viewport";

  const canvas = document.createElement("div");
  canvas.className = "panzoom-canvas";

  // Вставляем viewport на место mobileTree, а mobileTree переносим внутрь canvas
  host.replaceChild(viewport, mobileTree);
  canvas.appendChild(mobileTree); // Переносим #mobileTree внутрь canvas
  viewport.appendChild(canvas);

  let scale = 1;
  let tx = 0;
  let ty = 0;

  const MIN_SCALE = 0.6;
  const MAX_SCALE = 2.8;

  const pointers = new Map(); // pointerId -> {x,y}
  let startTx = 0, startTy = 0, startScale = 1;
  let startDist = 0, startMid = null;

  function applyTransform() {
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

  // Wheel zoom (для устройств с колесом прокрутки/тачпада)
  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const cx = e.clientX - rect.left; // Курсор относительно viewport
    const cy = e.clientY - rect.top;

    const delta = -e.deltaY; // Обычное направление скролла
    const zoomFactor = delta > 0 ? 1.08 : 0.92;

    const newScale = clamp(scale * zoomFactor, MIN_SCALE, MAX_SCALE);

    // Зум относительно курсора
    tx = cx - ((cx - tx) * (newScale / scale));
    ty = cy - ((cy - ty) * (newScale / scale));
    scale = newScale;

    applyTransform();
  }, { passive: false });

  viewport.addEventListener("pointerdown", (e) => {
    viewport.setPointerCapture(e.pointerId); // Захват указателя
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
      // Drag (панорамирование)
      // Используем movementX/Y для плавного перемещения
      tx += e.movementX;
      ty += e.movementY;
      applyTransform();
      return;
    }

    if (pointers.size === 2) {
      // Pinch zoom + pan
      const [p1, p2] = Array.from(pointers.values());
      const newDist = dist(p1, p2);
      const newMid = midpoint(p1, p2);

      const factor = newDist / (startDist || newDist); // Изменение расстояния между пальцами
      const newScale = clamp(startScale * factor, MIN_SCALE, MAX_SCALE);

      // Смещение по midpoint (центр между пальцами)
      tx = startTx + (newMid.x - startMid.x);
      ty = startTy + (newMid.y - startMid.y);
      scale = newScale;

      applyTransform();
    }
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) {
      // Если остался только один или ноль указателей, сбрасываем начальные значения
      startDist = 0;
      startMid = null;
      startScale = scale;
      startTx = tx;
      startTy = ty;
    }
  }

  viewport.addEventListener("pointerup", endPointer);
  viewport.addEventListener("pointercancel", endPointer);
  viewport.addEventListener("pointerleave", endPointer); // Добавим на случай увода курсора/пальца за пределы

  // Double tap to reset (опционально)
  let lastTap = 0;
  viewport.addEventListener("pointerup", (e) => {
    const now = Date.now();
    // Проверяем на двойной тап и то, что это не mouse (для wheel zoom)
    if (now - lastTap < 280 && e.pointerType !== "mouse") { 
      scale = 1;
      tx = 0;
      ty = 0;
      applyTransform();
    }
    lastTap = now;
  });

  applyTransform(); // Применяем начальные трансформации
}


/* =========================
   INIT
========================= */
/**
 * Инициализация приложения после загрузки DOM.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Загрузка данных карт из cards.json
  fetch("cards.json")
    .then((r) => r.json())
    .then((data) => {
      cards = data;
      renderMobileList();
      renderDesktopList();
      if (cards.length > 0) {
        openCard(cards[0].id); // Открываем первую карту по умолчанию
      } else {
          // Если карт нет, можно показать сообщение или заглушку
          console.warn("No cards found in cards.json.");
      }
    })
    .catch(error => {
      console.error("Error loading cards.json:", error);
      // Обработка ошибки загрузки данных
      alert("Не удалось загрузить данные карт. Пожалуйста, проверьте файл cards.json.");
    });

  // Перерисовка при изменении размера окна (для переключения между режимами)
  window.addEventListener("resize", () => {
    if (currentCardId) {
      openCard(currentCardId);
    }
  });
});





