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

/* ---------- TREE LOGIC ---------- */
function selectBranch(cardId){
  if (chosenPath.includes(cardId)) return;
  if (chosenPath.length >= 4) return;

  chosenPath.push(cardId);
  renderTree(desktopTree);
  if (!isDesktop()) renderTree(mobileTree);
}

function renderTree(container){
  container.innerHTML = "";
  if (!chosenPath.length) return;

  const ul = document.createElement("ul");

  // выбранный путь
  chosenPath.forEach(id => {
    const card = byId(id);
    if (!card) return;

    const li = document.createElement("li");
    li.innerHTML = `<span class="node locked">${card.title}</span>`;
    ul.appendChild(li);
  });

  // активный узел
  if (chosenPath.length < 4){
    const activeCard = byId(chosenPath[chosenPath.length - 1]);
    if (activeCard){
     getLinks(activeCard).forEach((id, index) => {   //изменение положения дерева 1стр//

        if (chosenPath.includes(id)) return;

        const card = byId(id);
        if (!card) return;

        const li = document.createElement("li");
       li.classList.add("branch", `branch-${index}`); //изменение пол дерева 1 стр//

        const btn = document.createElement("span");
        btn.className = "node";
        btn.textContent = card.title;
        btn.onclick = () => selectBranch(id);

        li.appendChild(btn);
        ul.appendChild(li);
      });
    }
  }

  container.appendChild(ul);
}

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
  chosenPath = [card.id]; // ← корень дерева
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
    if (isDesktop()) openCard(cards[0].id);
  });


function renderTree(rootId){
  const tree = document.getElementById("desktopTree");
  if (!tree) return;

  tree.innerHTML = "";

  const ul = document.createElement("ul");
  ul.appendChild(buildNode(rootId, new Set()));

  tree.appendChild(ul);
}



