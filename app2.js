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
const pathsBtn = document.getElementById("pathsBtn");

const drawerTree = document.getElementById("drawerTree");
const drawerPaths = document.getElementById("drawerPaths");
const mobileTree = document.getElementById("mobileTree");
const pathsTable = document.getElementById("pathsTable");

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

function buildTree(rootId, maxDepth = 4){
  const root = byId(rootId);
  if(!root) return null;
  const visited = new Set();

  function makeNode(id, depth){
    const c = byId(id);
    if(!c) return null;

    const key = `${id}:${depth}`;
    if(visited.has(key)) return { id, title: c.title, cycle: true, children: [] };
    visited.add(key);

    if(depth >= maxDepth) return { id, title: c.title, children: [] };

    const kids = getLinks(c)
      .map(cid => makeNode(cid, depth + 1))
      .filter(Boolean);

    return { id, title: c.title, children: kids };
  }

  return makeNode(rootId, 0);
}

function renderTree(container, rootId){
  container.innerHTML = "";
  const root = buildTree(rootId);
  if(!root) return;

  const rootCard = byId(rootId);

  function renderNode(node){
    const li = document.createElement("li");
    const btn = document.createElement("span");
    btn.className = "node" + (String(node.id) === String(rootId) ? " current" : "");
    btn.innerHTML = `<span>${node.title}</span><span class="badge">#${node.id}</span>`;
    btn.onclick = () => openCard(node.id);
    li.appendChild(btn);

    if(node.children && node.children.length){
      const ul = document.createElement("ul");
      node.children.forEach(ch => ul.appendChild(renderNode(ch)));
      li.appendChild(ul);
    }
    return li;
  }

  const ul = document.createElement("ul");
  ul.appendChild(renderNode(root));
  container.appendChild(ul);
}

function enumeratePaths(rootId, maxDepth = 5){
  const paths = [];
  const stack = [];

  function dfs(id, depth, seen){
    const c = byId(id);
    if(!c) return;
    stack.push(id);

    const nextIds = getLinks(c);
    const atLimit = depth >= maxDepth;
    if(nextIds.length === 0 || atLimit){
      paths.push([...stack]);
      stack.pop();
      return;
    }

    nextIds.forEach(nid => {
      if(seen.has(nid)){
        stack.push(nid);
        paths.push([...stack]);
        stack.pop();
        return;
      }
      const nseen = new Set(seen);
      nseen.add(nid);
      dfs(nid, depth + 1, nseen);
    });

    stack.pop();
  }

  dfs(rootId, 0, new Set([rootId]));
  return paths;
}

function renderPaths(container, rootId){
  container.innerHTML = "";
  const rootCard = byId(rootId);
  if(!rootCard) return;

  if(getLinks(rootCard).length === 0){
    container.innerHTML = `<div style="opacity:.75">Пока нет описанных ходов (см. <b>links</b> в cards.json).</div>`;
    return;
  }

  const paths = enumeratePaths(rootId);
  const table = document.createElement("table");
  table.innerHTML = `
    <thead><tr><th>Ветка</th><th>Ход</th><th>Карта</th></tr></thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  paths.forEach((path, idx) => {
    path.forEach((id, step) => {
      const c = byId(id);
      const tr = document.createElement("tr");

      const b = document.createElement("td");
      b.textContent = step === 0 ? String(idx + 1) : "";
      tr.appendChild(b);

      const s = document.createElement("td");
      s.textContent = String(step + 1);
      tr.appendChild(s);

      const t = document.createElement("td");
      t.innerHTML = `<span class="link">${c ? c.title : ("#" + id)}</span>`;
      t.querySelector(".link").onclick = () => {
        closeDrawer(drawerPaths);
        openCard(id);
      };
      tr.appendChild(t);

      tbody.appendChild(tr);
    });
  });

  const wrap = document.createElement("div");
  wrap.className = "paths";
  wrap.appendChild(table);
  container.appendChild(wrap);
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
    pathsBtn.classList.remove("hidden");
    renderCardMobile(card);
  } else {
    backBtn.classList.add("hidden");
    treeBtn.classList.add("hidden");
    pathsBtn.classList.add("hidden");
    renderCardDesktop(card);
  }

  renderDesktopList();
  if(desktopTree) renderTree(desktopTree, card.id);
  if(mobileTree) renderTree(mobileTree, card.id);
  if(pathsTable) renderPaths(pathsTable, card.id);
}

backBtn.onclick = () => {
  closeDrawer(drawerTree);
  closeDrawer(drawerPaths);
  cardView.classList.remove("active");
  listView.classList.add("active");
  backBtn.classList.add("hidden");
  treeBtn.classList.add("hidden");
  pathsBtn.classList.add("hidden");
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
pathsBtn.onclick = () => openDrawer(drawerPaths);
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


