// Простая SPA без фреймворков.
// ПК: сайдбар + дерево + карта. Мобилка: список -> карта + drawer'ы.

const listView = document.getElementById("listView"); //курлык//
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

/* ---------- HELPERS ---------- */
function byId(id){
  return cards.find(c => String(c.id) === String(id));
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
    row.className =
      "sidebar-item" +
      (String(card.id) === String(currentCardId) ? " active" : "");
    row.innerHTML = `<span>${card.title}</span><span class="badge">#${card.id}</span>`;
    row.onclick = () => openCard(card.id);
    desktopCardList.appendChild(row);
  });
}

/* ---------- DESKTOP TREE ---------- */
const lockedCards = new Set();
const MAX_DEPTH = 4;
lockedCards.clear(); ///////////////

function renderTree(rootId){
  const tree = desktopTree;
  if (!tree) return;

  tree.innerHTML = "";

  const scroll = document.createElement("div");
  scroll.className = "tree-scroll";

  const ul = document.createElement("ul");
  ul.appendChild(buildNode(rootId, 0, new Set()));

  scroll.appendChild(ul);
  tree.appendChild(scroll);

  // скролл выключен при старте
  scroll.style.overflowX = "hidden";
}
function buildNode(cardId, level, visited){
  if (level >= MAX_DEPTH) return null;
  if (visited.has(cardId)) return null;

  visited.add(cardId);
  lockedCards.add(cardId);

  const card = byId(cardId);
  if (!card) return null;

  const li = document.createElement("li");

  const node = document.createElement("div");
  node.className = "node";
  node.textContent = card.title;
  node.dataset.level = level;

  if (lockedCards.has(cardId)) {
    node.classList.add("locked");
  }

  li.appendChild(node);

  const links = getLinks(card);
  if (links.length && level < MAX_DEPTH - 1){
    const ul = document.createElement("ul");

    links.slice(0, 3).forEach(id => {
      if (lockedCards.has(id)) return;

      const child = buildNode(id, level + 1, new Set(visited));
      if (child) ul.appendChild(child);
    });

    if (ul.children.length){
      li.appendChild(ul);
    }
  }

  return li;
}
document.addEventListener("click", e => {
  const node = e.target.closest("#desktopTree .node");
  if (!node) return;

  const level = Number(node.dataset.level);
  const scroll = desktopTree.querySelector(".tree-scroll");

  if (scroll && level >= 1) {
    scroll.style.overflowX = "auto";
  }
});


/* ---------- CARD RENDER ---------- */
function renderCardDesktop(card){
  desktopCard.innerHTML = `
    <img src="images/${card.id}.jpg" alt="">
    <button class="open-pdf">Открыть карту (PDF)</button>
  `;
  desktopCard.querySelector(".open-pdf").onclick = () =>
    window.open(`pdfs/${card.pdf}`, "_blank");
}

function renderCardMobile(card){
  descTab.innerHTML = `
    <img src="images/${card.id}.jpg" class="card-image-large">
    <button class="open-pdf">Открыть карту</button>
  `;
  descTab.querySelector(".open-pdf").onclick = () =>
    window.open(`pdfs/${card.pdf}`, "_blank");
}

/* ---------- OPEN CARD ---------- */
function openCard(cardId){
  const card = byId(cardId);
  if (!card) return;

  currentCardId = card.id;
  title.textContent = card.title;

  if (isDesktop()){
    backBtn.classList.add("hidden");
    treeBtn.classList.add("hidden");
    renderCardDesktop(card);
    renderDesktopTree(card.id);
  } else {
    listView.classList.remove("active");
    cardView.classList.add("active");
    backBtn.classList.remove("hidden");
    treeBtn.classList.remove("hidden");
    renderCardMobile(card);
  }

  renderDesktopList();
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
    if (isDesktop() && cards.length){
      openCard(cards[0].id);
    }
  });




