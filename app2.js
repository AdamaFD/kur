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

/* ---------- GRID SETTINGS ---------- */
const GRID_ROWS = 16;
const GRID_COLS = 9;
const CHILD_HEIGHT = 3;

const CENTER_COL = Math.floor(GRID_COLS / 2) + 1;

let nodePositions = {};

/* ---------- HELPERS ---------- */
function byId(id){
  return cards.find(c => String(c.id) === String(id));
}

function getLinks(card){
  return Array.isArray(card.links) ? card.links : [];
}

function isDesktop(){
  return window.matchMedia("(min-width: 920px)").matches;
}

/* ---------- LISTS ---------- */
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

function renderDesktopList(){
  desktopCardList.innerHTML = "";
  cards.forEach(card => {
    const row = document.createElement("div");
    row.className =
      "sidebar-item" +
      (String(card.id) === String(currentCardId) ? " active" : "");
    row.innerHTML = `<span>${card.title}</span><span class="badge">#${card.id}</span>`;
    row.onclick = () => openCard(card.id);
    desktopCardList.appendChild(row);
  });
}

/* ---------- TREE LOGIC ---------- */
function selectBranch(cardId) {
  const card = byId(cardId);
  if (!card) return;

  const index = chosenPath.indexOf(cardId);
  const isNew = index === -1;

  if (isNew) {
    if (chosenPath.length >= GRID_ROWS) return;
    chosenPath.push(cardId);
  } else {
    chosenPath = chosenPath.slice(0, index + 1);
  }

  nodePositions = {};
  nodePositions[chosenPath[0]] = { col: CENTER_COL, row: 1 };

  for (let i = 0; i < chosenPath.length - 1; i++) {
    const parentId = chosenPath[i];
    const nextId = chosenPath[i + 1];

    const parentPos = nodePositions[parentId];
    const childrenPos = calculateChildrenPositions(
      byId(parentId),
      parentPos.col,
      parentPos.row
    );

    nodePositions[nextId] =
      childrenPos[nextId] || {
        col: parentPos.col,
        row: parentPos.row + CHILD_HEIGHT
      };
  }

  renderTree(desktopTree);
  if (!isDesktop()) renderTree(mobileTree);
}

/* ---------- CHILD POSITION CALC ---------- */
function calculateChildrenPositions(parentCard, parentCol, parentRow) {
  const children = getLinks(parentCard);
  if (!children.length) return {};

  const row = parentRow + 1;

  let startCol = parentCol - Math.floor((children.length - 1) / 2);
  startCol = Math.max(1, Math.min(startCol, GRID_COLS - children.length + 1));

  const pos = {};
  children.forEach((childId, i) => {
    pos[childId] = {
      col: startCol + i,
      row
    };
  });

  return pos;
}

/* ---------- RENDER TREE ---------- */
function renderTree(container) {
  container.innerHTML = "";
  if (!chosenPath.length) return;

  // locked path
  chosenPath.forEach(cardId => {
    const card = byId(cardId);
    const pos = nodePositions[cardId];
    if (!card || !pos) return;

    const div = document.createElement("div");
    div.className = "grid-node locked";
    div.textContent = card.title;
    div.style.gridColumnStart = pos.col;
    div.style.gridRowStart = pos.row;
    div.style.gridRowEnd = "span 1";
    container.appendChild(div);
  });

  // options
  chosenPath.forEach((cardId, index) => {
    const card = byId(cardId);
    const parentPos = nodePositions[cardId];
    if (!card || !parentPos) return;

    const childrenPos = calculateChildrenPositions(
      card,
      parentPos.col,
      parentPos.row
    );

    const isLast = index === chosenPath.length - 1;
    const nextChosenId = chosenPath[index + 1];

    for (const childId in childrenPos) {
      if (nextChosenId && String(nextChosenId) === String(childId)) continue;
      if (chosenPath.includes(String(childId))) continue;

      const childCard = byId(childId);
      if (!childCard) continue;

      const { col, row } = childrenPos[childId];

      const div = document.createElement("div");
      div.textContent = childCard.title;
      div.style.gridColumnStart = col;
      div.style.gridRowStart = row;
      div.style.gridRowEnd = `span ${CHILD_HEIGHT}`;

      if (isLast) {
        div.className = "grid-node active-choice";
        div.onclick = () => selectBranch(childCard.id);
      } else {
        div.className = "grid-node inactive-choice";
      }

      container.appendChild(div);
    }
  });
}

/* ---------- CARD RENDER ---------- */
function renderCardDesktop(card){
  desktopCard.innerHTML = `
    <img src="images/${card.id}.jpg" alt="">
    <button class="open-pdf">Открыть карту (PDF)</button>
  `;
  desktopCard.querySelector(".open-pdf").onclick =
    () => window.open(`pdfs/${card.pdf}`, "_blank");
}

function renderCardMobile(card){
  descTab.innerHTML = `
    <img src="images/${card.id}.jpg" class="card-image-large">
    <button class="open-pdf">Открыть карту</button>
  `;
  descTab.querySelector(".open-pdf").onclick =
    () => window.open(`pdfs/${card.pdf}`, "_blank");
}

/* ---------- OPEN CARD ---------- */
function openCard(cardId){
  const card = byId(cardId);
  if (!card) return;

  currentCardId = card.id;
  chosenPath = [card.id];
  nodePositions = {
    [card.id]: { col: CENTER_COL, row: 1 }
  };

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
    if (isDesktop() && cards.length) openCard(cards[0].id);
  });




