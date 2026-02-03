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
function renderDesktopTree(rootId){
  if (!desktopTree) return;

  desktopTree.innerHTML = "";

  const ul = document.createElement("ul");
  const rootNode = buildNode(rootId, new Set(), 0);

  if (rootNode) ul.appendChild(rootNode);
  desktopTree.appendChild(ul);
}

function buildNode(cardId, visited, level){
  if (visited.has(cardId)) return null;
  visited.add(cardId);

  const card = byId(cardId);
  if (!card) return null;

  const li = document.createElement("li");

  const node = document.createElement("span");
  node.className = "node";
  node.textContent = card.title;
  node.dataset.id = cardId;
  node.dataset.level = level;

  li.appendChild(node);

  if (Array.isArray(card.links) && card.links.length){
    const ul = document.createElement("ul");

    card.links.forEach(linkId => {
      const child = buildNode(linkId, new Set(visited), level + 1);
      if (child) ul.appendChild(child);
    });

    if (ul.children.length) li.appendChild(ul);
  }

  return li;
}

/* ---------- TREE TOGGLE ---------- */
document.addEventListener("click", e => {
  const node = e.target.closest("#desktopTree .node");
  if (!node) return;

  const li = node.parentElement;
  li.classList.toggle("open");
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




