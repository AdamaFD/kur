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

const mobileTree = document.getElementById("mobileTree");

let cards = [];
let currentCardId = null;

// ----------------------------
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ----------------------------

function byId(id){
  return cards.find(c => String(c.id) === String(id));
}

function getLinks(card){
  if(!card) return [];
  if(Array.isArray(card.links)) return card.links;
  return [];
}

function isDesktop(){
  return window.matchMedia("(min-width: 920px)").matches;
}

// ----------------------------
// РЕНДЕР СПИСКОВ
// ----------------------------

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

// ----------------------------
// ЛОГИКА ВЫБОРА ВЕТОК
// ----------------------------

let chosenPath = [];

function selectBranch(cardId){
  if (chosenPath.includes(cardId)) return;

  chosenPath.push(cardId);

  if (chosenPath.length >= 4){
    renderTree(desktopTree, cardId);
    if (mobileTree) renderTree(mobileTree, cardId);
    return;
  }

  renderTree(desktopTree, cardId);
  if (mobileTree) renderTree(mobileTree, cardId);
}

// ----------------------------
// ДЕРЕВО (ВСЕГДА ВИДИМОЕ)
// ----------------------------

function renderTree(container, rootId){
  container.innerHTML = "";

  const root = byId(rootId);
  if (!root) return;

  const links = getLinks(root);
  const ul = document.createElement("ul");

  // путь сверху
  chosenPath.forEach(id => {
    const card = byId(id);
    const li = document.createElement("li");
    li.innerHTML = `<span class="node locked">${card.title} #${card.id}</span>`;
    ul.appendChild(li);
  });

  // три дочерние карты
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

// ----------------------------
// РЕНДЕР КАРТЫ
// ----------------------------

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
  desktopCard.innerHTML = `
    <img src="images/${card.id}.jpg" alt="">
    <button class="open-pdf" style="max-width:320px;">Открыть карту (PDF)</button>
  `;
  desktopCard.querySelector(".open-pdf").onclick = () => {
    window.open(`pdfs/${card.pdf}`, "_blank");
  };
}

// ----------------------------
// ОТКРЫТИЕ КАРТЫ
// ----------------------------

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
    renderCardMobile(card);
  } else {
    backBtn.classList.add("hidden");
    renderCardDesktop(card);
  }

  renderDesktopList();

  desktopTree.style.display = "block";
  renderTree(desktopTree, card.id);

  if (mobileTree){
    mobileTree.style.display = "block";
    renderTree(mobileTree, card.id);
  }
}

// ----------------------------
// МОБИЛЬНАЯ КНОПКА НАЗАД
// ----------------------------

backBtn.onclick = () => {
  cardView.classList.remove("active");
  listView.classList.add("active");
  backBtn.classList.add("hidden");
  title.textContent = "Карты";
  currentCardId = null;
};

// ----------------------------
// РЕСАЙЗ
// ----------------------------

window.addEventListener("resize", () => {
  if(currentCardId !== null) openCard(currentCardId);
});

// ----------------------------
// ЗАГРУЗКА JSON
// ----------------------------

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



