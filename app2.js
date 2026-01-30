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
    const row




