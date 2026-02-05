// Простая SPA без фреймворков.
// ПК: сайдбар + дерево + карта. Мобилка: список -> карта + drawer'ы.

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
let chosenPath = [];
// --- НОВЫЕ ПЕРЕМЕННЫЕ ДЛЯ СЕТКИ ---
const GRID_COLS = 7;
const GRID_ROWS = 5;
// Объект для хранения координат каждого узла: { cardId: { col: N, row: M } }
let nodePositions = {};
function byId(id){
  return cards.find(c => String(c.id) === String(id));
}
function getLinks(card){
  return Array.isArray(card.links) ? card.links : [];
}
function isDesktop(){
  return window.matchMedia("(min-width: 920px)").matches;
}
/* ---------- MOBILE LIST ---------- */
function renderMobileList(){
  cardList.innerHTML = "";
  cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "card-item";
    div.innerHTML = `<h4>${card.title}</h4>`;
    div.onclick = () => openCard(card.id);
    cardList.appendChild(div);
  });
}
/* ---------- DESKTOP LIST ---------- */
function renderDesktopList(){
  desktopCardList.innerHTML = "";
  cards.forEach(card => {
    const row = document.createElement("div");
    row.className = "sidebar-item" +
      (String(card.id) === String(currentCardId) ? " active" : "");
    row.innerHTML = `<span>${card.title}</span><span class="badge">#${card.id}</span>`;
    row.onclick = () => openCard(card.id);
    desktopCardList.appendChild(row);
  });
}
/* ---------- TREE LOGIC (ИСПРАВЛЕНО) ---------- */
function selectBranch(cardId) {
  const card = byId(cardId);
  if (!card) return;

  const currentPathIndex = chosenPath.indexOf(cardId);
  const isNewSelection = (currentPathIndex === -1);

  if (isNewSelection) {
    if (chosenPath.length >= GRID_ROWS) {
      console.warn("Максимальная глубина пути достигнута.");
      return;
    }
    chosenPath.push(cardId);
  } else {
    chosenPath = chosenPath.slice(0, currentPathIndex + 1);
  }

  // Пересчитываем позиции только для узлов пути (но корректно)
  nodePositions = {};
  if (chosenPath.length > 0) {
    nodePositions[chosenPath[0]] = { col: 4, row: 1 }; // корень

    for (let i = 0; i < chosenPath.length - 1; i++) {
      const parentId = chosenPath[i];
      const nextId = chosenPath[i + 1];

      const parentPos = nodePositions[parentId];
      const childrenPos = calculateChildrenPositions(byId(parentId), parentPos.col, parentPos.row);

      nodePositions[nextId] = childrenPos[nextId] || {
        col: parentPos.col,
        row: Math.min(parentPos.row + 1, GRID_ROWS)
      };
    }
  }

  renderTree(desktopTree);
  if (!isDesktop()) renderTree(mobileTree);
}

// Вспомогательная функция для расчета дочерних позиций.
// Возвращает объект { cardId: { col, row } } для детей.
// Больше не изменяет глобальный nodePositions напрямую.
function calculateChildrenPositions(parentCard, parentCol, parentRow) {
  const children = getLinks(parentCard); // НЕ фильтруем chosenPath здесь
  if (!children.length) return {};

  const row = Math.min(parentRow + 1, GRID_ROWS);

  // хотим разложить детей горизонтально, центрируя относительно parentCol
  // startCol подбираем так, чтобы всё влезло в [1..GRID_COLS]
  let startCol = parentCol - Math.floor((children.length - 1) / 2);

  // зажимаем startCol, чтобы (startCol + children.length - 1) не вылезал за GRID_COLS
  startCol = Math.max(1, Math.min(startCol, GRID_COLS - children.length + 1));

  const pos = {};
  children.forEach((childId, i) => {
    pos[childId] = { col: startCol + i, row };
  });

  return pos;
}


function renderTree(container) {
  container.innerHTML = "";
  if (!chosenPath.length) return;

  const rootId = chosenPath[0];
  if (!nodePositions[rootId]) nodePositions[rootId] = { col: 4, row: 1 };

  // 1) рисуем все locked узлы пути
  chosenPath.forEach((cardId) => {
    const card = byId(cardId);
    if (!card) return;

    const pos = nodePositions[cardId];
    if (!pos) return;

    const div = document.createElement("div");
    div.className = "grid-node locked";
    div.textContent = card.title;
    div.style.gridColumnStart = pos.col;
    div.style.gridRowStart = pos.row;
    container.appendChild(div);
  });

  // 2) рисуем опции (детей) для каждого узла пути:
  chosenPath.forEach((cardId, index) => {
    const card = byId(cardId);
    if (!card) return;

    const parentPos = nodePositions[cardId];
    if (!parentPos) return;
    if (parentPos.row >= GRID_ROWS) return; // ниже сетки нельзя

    const childrenPos = calculateChildrenPositions(card, parentPos.col, parentPos.row);

    const isLast = (index === chosenPath.length - 1);
    const nextChosenId = chosenPath[index + 1]; // может быть undefined

    for (const childIdStr in childrenPos) {
      const childId = String(childIdStr);
      const childCard = byId(childId);
      if (!childCard) continue;

      // если этот ребёнок — следующий выбранный по пути, не рисуем как опцию (он already locked)
      if (nextChosenId != null && String(nextChosenId) === childId) continue;

      // если вдруг циклы/повторения — не показываем уже выбранные узлы как опции
      if (chosenPath.some(x => String(x) === childId)) continue;

      const { col, row } = childrenPos[childIdStr];

      const childDiv = document.createElement("div");
      childDiv.textContent = childCard.title;
      childDiv.style.gridColumnStart = col;
      childDiv.style.gridRowStart = row;

      if (isLast) {
        childDiv.className = "grid-node active-choice";
        childDiv.onclick = () => selectBranch(childCard.id);
      } else {
        childDiv.className = "grid-node inactive-choice";
        // без onclick — и дополнительно отключим pointer-events через CSS
      }

      container.appendChild(childDiv);
    }
  });
}
/* ---------- CARD RENDER ---------- */
function renderCardDesktop(card){
  desktopCard.innerHTML = `
    <img src="images/${card.id}.jpg" alt="">
    <button class="open-pdf">Открыть карту (PDF)</button>
  `;
  const openPdfBtn = desktopCard.querySelector(".open-pdf");
  if (openPdfBtn) {
    openPdfBtn.onclick = () =>
      window.open(`pdfs/${card.pdf}`, "_blank");
  }
}
function renderCardMobile(card){
  descTab.innerHTML = `
    <img src="images/${card.id}.jpg" class="card-image-large">
    <button class="open-pdf">Открыть карту</button>
  `;
  const openPdfBtn = descTab.querySelector(".open-pdf");
  if (openPdfBtn) {
    openPdfBtn.onclick = () =>
      window.open(`pdfs/${card.pdf}`, "_blank");
  }
}
/* ---------- OPEN CARD (ОБНОВЛЕНО) ---------- */
function openCard(cardId){
  const card = byId(cardId);
  if (!card) return;
  currentCardId = card.id;
  chosenPath = [card.id];
  nodePositions = { [card.id]: { col: Math.floor(GRID_COLS / 2) + 1, row: 1 } }; // Корень всегда по центру на 1 ряду
  title.textContent = card.title;
  if (isDesktop()){
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
/* ---------- NAV ---------- */
backBtn.onclick = () => {
  cardView.classList.remove("active");
  listView.classList.add("active");
  backBtn.classList.add("hidden");
  treeBtn.classList.add("hidden");
};
treeBtn.onclick = () => drawerTree.classList.add("open");
document.addEventListener("click", e => {
  const key = e.target?.getAttribute("data-close");
  if (key) document.getElementById(key).classList.remove("open");
});
/* ---------- INIT ---------- */
fetch("cards.json") 
  .then(r => r.json())
  .then(data => {
    cards = data;
    renderMobileList();
    if (isDesktop() && cards.length > 0) openCard(cards[0].id);
  });




