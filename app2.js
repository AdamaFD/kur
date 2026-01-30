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

function byId(id){
  return cards.find(c => String(c.id) === String(id));
}

function getLinks(card){
  if(!card) return [];
  if(Array.isArray(card.links)) return card.links;
  if(Array.isArray(card.next)) return card.next;
  return [];
}

function isDesktop(){
  return window.matchMedia("(min-width: 920px)").matches;
}

function renderMobileList(){
  cardList.innerHTML = "";
  cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "card-item";
    div.innerHTML = `
      <h4>${card.title}</h4>
    `;
    div.onclick = () => openCard(card.id);
    cardList.appendChild(div);
  });
}

function renderDesktopList(){
  if(!desktopCardList) return;
  desktopCardList.innerHTML = "";
  cards.forEach(card => {
    const row = document.createElement("div");
    row.className = "sidebar-item" + (String(card.id) === String(currentCardId) ? " active" : "");
    row.innerHTML = `<span>${card.title}</span><span class="badge">#${card.id}</span>`;
    row.onclick = () => openCard(card.id);
    desktopCardList.appendChild(row);
  });
}

// Храним путь выбранных карт
let chosenPath = [];

// Выбор ветки
function selectBranch(cardId){
  if (chosenPath.includes(cardId)) return;

  chosenPath.push(cardId);

  if (chosenPath.length >= 4){
    renderTree(desktopTree, cardId);
    return;
  }

  renderTree(desktopTree, cardId);
}

// Упрощённое дерево: только 3 дочерние карты
function renderTree(container, rootId){
  container.innerHTML = "";

  const root = byId(rootId);
  if (!root) return;

  const links = getLinks(root);

  const ul = document.createElement("ul");

  // показываем путь сверху
  chosenPath.forEach(id => {
    const card = byId(id);
    const li = document.createElement("li");
    li.innerHTML = `<span class="node locked">${card.title} #${card.id}</span>`;
    ul.appendChild(li);
  });

  // текущий уровень — три дочерние карты
  links.forEach(id => {
    const card = byId(id);
    if (!card) return;

    const li = document.createElement("li");
    const btn = document.createElement("span");

    if (chosenPath.includes(id)){
      btn.className = "node locked";
    } else {
      btn.className = "node";
      btn.onclick = () => selectBranch(id);
    }

    btn.innerHTML = `${card.title} #${card.id}`;
    li.appendChild(btn);
    ul.appendChild(li);
  });

  container.appendChild(ul);
}


function renderCardMobile(card){
  descTab.innerHTML = `
    <img src="images/${card.id}.jpg" class="card-image-large" alt="">
    <button class="open-pdf">Открыть карту</button>
  `;
  descTab.querySelector(".open-pdf").onclick = () => {
    window.open(`pdfs/${card.pdf}`, "_blank");
  };
}

function renderCardDesktop(card){
  if(!desktopCard) return;
  desktopCard.innerHTML = `
    <img src="images/${card.id}.jpg" alt="">
    <button class="open-pdf" style="max-width:320px;">Открыть карту (PDF)</button>
  `;
  desktopCard.querySelector(".open-pdf").onclick = () => {
    window.open(`pdfs/${card.pdf}`, "_blank");
  };
}

function openCard(cardId){
  if (currentCardId === cardId) return;
  const card = byId(cardId);
  if(!card) return;

  currentCardId = card.id;
  title.textContent = card.title;

  if(!isDesktop()){
    listView.classList.remove("active");
    cardView.classList.add("active");
    backBtn.classList.remove("hidden");
    treeBtn.classList.remove("hidden");
    
    renderCardMobile(card);
  } else {
    backBtn.classList.add("hidden");
    treeBtn.classList.add("hidden");
    
    renderCardDesktop(card);
  }

  renderDesktopList();
  if(desktopTree) renderTree(desktopTree, card.id);
  if(mobileTree) renderTree(mobileTree, card.id);
  
}

backBtn.onclick = () => {
  closeDrawer(drawerTree);
  
  cardView.classList.remove("active");
  listView.classList.add("active");
  backBtn.classList.add("hidden");
  treeBtn.classList.add("hidden");
 
  title.textContent = "Карты";
  currentCardId = null;
};

window.addEventListener("resize", () => {
  if(currentCardId !== null) openCard(currentCardId);
  else if(isDesktop() && cards.length) openCard(cards[0].id);
});

function openDrawer(el){
  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");
}

function closeDrawer(el){
  el.classList.remove("open");
  el.setAttribute("aria-hidden", "true");
}

document.addEventListener("click", (e) => {
  const key = e.target?.getAttribute?.("data-close");
  if(!key) return;
  const el = document.getElementById(key);
  if(el) closeDrawer(el);
});

treeBtn.onclick = () => openDrawer(drawerTree);

fetch("cards.json")
  .then(res => res.json())
  .then(data => {
    cards = data;
    renderMobileList();

    setTimeout(() => {
      if (isDesktop()) {
        openCard(cards[0].id);
      } else {
        title.textContent = "Карты";
      }
    }, 50);
  })
  .catch(() => {
    title.textContent = "Ошибка";
    const msg = document.createElement("div");
    msg.style.padding = "14px";
    msg.textContent = "Не удалось загрузить cards.json";
    document.body.appendChild(msg);
  });


