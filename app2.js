/* ============================
   ДАННЫЕ
============================ */
const schemes = [
  { id: 1, title: "Assassinate", tree: [] },
  { id: 2, title: "Breakthrough", tree: [] },
  { id: 3, title: "Scheme 3", tree: [] },
  { id: 4, title: "Scheme 4", tree: [] },
  { id: 5, title: "Scheme 5", tree: [] },
  { id: 6, title: "Scheme 6", tree: [] },
  { id: 7, title: "Scheme 7", tree: [] },
  { id: 8, title: "Scheme 8", tree: [] },
  { id: 9, title: "Scheme 9", tree: [] },
  { id: 10, title: "Scheme 10", tree: [] },
  { id: 11, title: "Scheme 11", tree: [] },
  { id: 12, title: "Scheme 12", tree: [] },
  { id: 13, title: "Scheme 13", tree: [] },
  { id: 14, title: "Scheme 14", tree: [] },
  { id: 15, title: "Scheme 15", tree: [] }
];

/* ============================
   DOM
============================ */
const desktopCardList = document.getElementById("desktopCardList");
const desktopTree = document.getElementById("desktopTree");

const listView = document.getElementById("listView");
const cardView = document.getElementById("cardView");

const drawer = document.getElementById("drawerTree");
const drawerOverlay = drawer.querySelector(".drawer-overlay");
const mobileTree = document.getElementById("mobileTree");

/* ============================
   РЕНДЕР СПИСКА КАРТ
============================ */
function renderCardList() {
  desktopCardList.innerHTML = "";
  listView.innerHTML = "";

  schemes.forEach((scheme) => {
    /* ---- DESKTOP ---- */
    const item = document.createElement("div");
    item.className = "sidebar-item";
    item.textContent = `${scheme.title} #${scheme.id}`;
    item.addEventListener("click", () => {
      highlightDesktopItem(scheme.id);
      renderSchemeDesktop(scheme.id);
    });
    desktopCardList.appendChild(item);

    /* ---- MOBILE ---- */
    const mobileItem = document.createElement("div");
    mobileItem.className = "card-item";
    mobileItem.innerHTML = `<h4>${scheme.title}</h4>`;
    mobileItem.addEventListener("click", () => openMobileCard(scheme.id));
    listView.appendChild(mobileItem);
  });
}

/* Подсветка выбранной карты на десктопе */
function highlightDesktopItem(id) {
  document.querySelectorAll(".sidebar-item").forEach((el) => {
    el.classList.remove("active");
  });

  const target = [...desktopCardList.children].find((el) =>
    el.textContent.includes(`#${id}`)
  );
  if (target) target.classList.add("active");
}

/* ============================
   ДЕСКТОП — РЕНДЕР КАРТЫ
============================ */
function renderSchemeDesktop(id) {
  const scheme = schemes.find((s) => s.id === id);
  if (!scheme) return;

  desktopTree.innerHTML = "";

  /* ---- Рендер узлов дерева ---- */
  scheme.tree.forEach((node) => {
    const div = document.createElement("div");
    div.className = `grid-node branch-${node.branch || 0}`;
    div.style.gridRowStart = node.row;
    div.style.gridColumnStart = node.col;

    div.innerHTML = `
      <span class="node-title">${node.title}</span>
      <div class="card-preview">
        <img src="${id}.png">
      </div>
    `;

    desktopTree.appendChild(div);
  });
}

/* ============================
   МОБИЛЬНАЯ КАРТОЧКА
============================ */
function openMobileCard(id) {
  cardView.innerHTML = "";

  const card = document.getElementById(`scheme-${id}`).cloneNode(true);
  cardView.appendChild(card);

  cardView.classList.add("active");
  listView.classList.remove("active");

  /* Кнопка "Связи" */
  const btn = document.createElement("button");
  btn.textContent = "Показать связи";
  btn.className = "open-pdf";
  btn.style.marginTop = "16px";
  btn.addEventListener("click", () => openMobileTree(id));

  cardView.appendChild(btn);
}

/* ============================
   МОБИЛЬНОЕ ДЕРЕВО (DRAWER)
============================ */
function openMobileTree(id) {
  mobileTree.innerHTML = "";

  const scheme = schemes.find((s) => s.id === id);
  if (!scheme) return;

  /* Добавляем panzoom-контейнер */
  const viewport = document.createElement("div");
  viewport.className = "panzoom-viewport";

  const canvas = document.createElement("div");
  canvas.className = "panzoom-canvas";

  viewport.appendChild(canvas);
  canvas.appendChild(mobileTree);

  drawer.querySelector(".drawer-panel").prepend(viewport);

  /* Рендер узлов */
  scheme.tree.forEach((node) => {
    const div = document.createElement("div");
    div.className = `grid-node branch-${node.branch || 0}`;
    div.style.gridRowStart = node.row;
    div.style.gridColumnStart = node.col;
    div.innerHTML = `<span class="node-title">${node.title}</span>`;
    mobileTree.appendChild(div);
  });

  drawer.classList.add("open");
}

/* Закрытие drawer */
drawerOverlay.addEventListener("click", () => {
  drawer.classList.remove("open");
});

/* ============================
   СТАРТ
============================ */
renderCardList();
renderSchemeDesktop(1);
highlightDesktopItem(1);
