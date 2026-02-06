// Фиктивные данные для 40 карт, основанные на новой структуре сетки 9x6
const cardsData = [
    { "id": "card-L1-1", "level": 1, "text": "Start Node Main Card" },
    // Уровень 2 (3 карты)
    { "id": "card-L2-1", "level": 2, "text": "Second Level Card A" },
    { "id": "card-L2-2", "level": 2, "text": "Second Level Card B" },
    { "id": "card-L2-3", "level": 2, "text": "Second Level Card C" },
    // Уровень 3 (9 карт)
    { "id": "card-L3-1", "level": 3, "text": "Third Level Node 1-1" },
    { "id": "card-L3-2", "level": 3, "text": "Third Level Node 1-2" },
    { "id": "card-L3-3", "level": 3, "text": "Third Level Node 1-3" },
    { "id": "card-L3-4", "level": 3, "text": "Third Level Node 2-1" },
    { "id": "card-L3-5", "level": 3, "text": "Third Level Node 2-2" },
    { "id": "card-L3-6", "level": 3, "text": "Third Level Node 2-3" },
    { "id": "card-L3-7", "level": 3, "text": "Third Level Node 3-1" },
    { "id": "card-L3-8", "level": 3, "text": "Third Level Node 3-2" },
    { "id": "card-L3-9", "level": 3, "text": "Third Level Node 3-3" },
    // Уровень 4 (27 карт)
    { "id": "card-L4-1", "level": 4, "text": "L4 Child of L3-1 Node 1" },
    { "id": "card-L4-2", "level": 4, "text": "L4 Child of L3-1 Node 2" },
    { "id": "card-L4-3", "level": 4, "text": "L4 Child of L3-1 Node 3" },
    { "id": "card-L4-4", "level": 4, "text": "L4 Child of L3-2 Node 1" },
    { "id": "card-L4-5", "level": 4, "text": "L4 Child of L3-2 Node 2" },
    { "id": "card-L4-6", "level": 4, "text": "L4 Child of L3-2 Node 3" },
    { "id": "card-L4-7", "level": 4, "text": "L4 Child of L3-3 Node 1" },
    { "id": "card-L4-8", "level": 4, "text": "L4 Child of L3-3 Node 2" },
    { "id": "card-L4-9", "level": 4, "text": "L4 Child of L3-3 Node 3" },
    { "id": "card-L4-10", "level": 4, "text": "L4 Child of L3-4 Node 1" },
    { "id": "card-L4-11", "level": 4, "text": "L4 Child of L3-4 Node 2" },
    { "id": "card-L4-12", "level": 4, "text": "L4 Child of L3-4 Node 3" },
    { "id": "card-L4-13", "level": 4, "text": "L4 Child of L3-5 Node 1" },
    { "id": "card-L4-14", "level": 4, "text": "L4 Child of L3-5 Node 2" },
    { "id": "card-L4-15", "level": 4, "text": "L4 Child of L3-5 Node 3" },
    { "id": "card-L4-16", "level": 4, "text": "L4 Child of L3-6 Node 1" },
    { "id": "card-L4-17", "level": 4, "text": "L4 Child of L3-6 Node 2" },
    { "id": "card-L4-18", "level": 4, "text": "L4 Child of L3-6 Node 3" },
    { "id": "card-L4-19", "level": 4, "text": "L4 Child of L3-7 Node 1" },
    { "id": "card-L4-20", "level": 4, "text": "L4 Child of L3-7 Node 2" },
    { "id": "card-L4-21", "level": 4, "text": "L4 Child of L3-7 Node 3" },
    { "id": "card-L4-22", "level": 4, "text": "L4 Child of L3-8 Node 1" },
    { "id": "card-L4-23", "level": 4, "text": "L4 Child of L3-8 Node 2" },
    { "id": "card-L4-24", "level": 4, "text": "L4 Child of L3-8 Node 3" },
    { "id": "card-L4-25", "level": 4, "text": "L4 Child of L3-9 Node 1" },
    { "id": "card-L4-26", "level": 4, "text": "L4 Child of L3-9 Node 2" },
    { "id": "card-L4-27", "level": 4, "text": "L4 Child of L3-9 Node 3" }
];

const gridContainer = document.getElementById('grid-container');
const appContainer = document.getElementById('app-container');

// Динамическое создание и добавление карт
cardsData.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.id = card.id;
    cardElement.classList.add('card');
    cardElement.textContent = card.text;
    gridContainer.appendChild(cardElement);
});

// Функциональность панорамирования и масштабирования
let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let startX, startY;
let initialGridTransform = getComputedStyle(gridContainer).transform;

function updateTransform() {
    gridContainer.style.transform = `${initialGridTransform} translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

// Колесо мыши для масштабирования
appContainer.addEventListener('wheel', (e) => {
    e.preventDefault(); // Предотвратить прокрутку страницы
    const scaleAmount = 0.1;
    const appRect = appContainer.getBoundingClientRect();
    const mouseX = e.clientX - appRect.left;
    const mouseY = e.clientY - appRect.top;

    const oldScale = scale;
    if (e.deltaY < 0) {
        scale += scaleAmount; // Увеличить
    } else {
        scale -= scaleAmount; // Уменьшить
    }
    scale = Math.max(0.2, Math.min(3, scale)); // Ограничить масштаб между 0.2 и 3

    // Отрегулировать смещение для масштабирования относительно указателя мыши
    // Вычислить координаты относительно *текущей позиции и масштаба контейнера сетки*
    const gridRect = gridContainer.getBoundingClientRect();
    const gridX = mouseX - gridRect.left;
    const gridY = mouseY - gridRect.top;

    translateX -= (gridX / oldScale) * (scale - oldScale);
    translateY -= (gridY / oldScale) * (scale - oldScale);

    updateTransform();
});

// Перетаскивание мышью для панорамирования
appContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    appContainer.style.cursor = 'grabbing';
});

appContainer.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateTransform();
});

appContainer.addEventListener('mouseup', () => {
    isDragging = false;
    appContainer.style.cursor = 'grab';
});

appContainer.addEventListener('mouseleave', () => {
    isDragging = false;
    appContainer.style.cursor = 'grab';
});

// Сенсорные события для панорамирования и масштабирования на мобильных устройствах
let touchStartX, touchStartY;
let initialDistance = -1; // Для масштабирования щипком
let lastScale = 1;
let initialTranslateX, initialTranslateY;

appContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        isDragging = true;
        initialTranslateX = translateX;
        initialTranslateY = translateY;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        appContainer.style.cursor = 'grabbing';
    } else if (e.touches.length === 2) {
        // Масштабирование щипком
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        lastScale = scale;
        isDragging = false; // Отключить панорамирование одним пальцем во время щипка
    }
}, { passive: false }); // Использовать passive: false, чтобы разрешить preventDefault

appContainer.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Предотвратить прокрутку на сенсорных устройствах

    if (isDragging && e.touches.length === 1) {
        translateX = initialTranslateX + (e.touches[0].clientX - touchStartX);
        translateY = initialTranslateY + (e.touches[0].clientY - touchStartY);
        updateTransform();
    } else if (e.touches.length === 2 && initialDistance > 0) {
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const newScale = lastScale * (currentDistance / initialDistance);
        
        // Вычислить центральную точку двух касаний относительно appContainer
        const appRect = appContainer.getBoundingClientRect();
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - appRect.left;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - appRect.top;

        const oldScale = scale;
        scale = Math.max(0.2, Math.min(3, newScale)); // Ограничить масштаб

        // Отрегулировать смещение для масштабирования относительно центра щипка
        // Вычислить координаты относительно *текущей позиции и масштаба контейнера сетки*
        const gridRect = gridContainer.getBoundingClientRect();
        const gridX = centerX - gridRect.left;
        const gridY = centerY - gridRect.top;

        translateX -= (gridX / oldScale) * (scale - oldScale);
        translateY -= (gridY / oldScale) * (scale - oldScale);
        updateTransform();
    }
}, { passive: false });

appContainer.addEventListener('touchend', () => {
    isDragging = false;
    initialDistance = -1;
    appContainer.style.cursor = 'grab';
});

function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// Изначальный стиль курсора
appContainer.style.cursor = 'grab';




