/* -------------------------------------------------------------------------- */
/*                                  cards.json data                           */
/* -------------------------------------------------------------------------- */
const allCards = [
    {
        "id": 1,
        "title": "Assassinate",
        "pdf": "M4E_Scheme_Assassinate.pdf",
        "links": [13, 3, 12]
    },
    {
        "id": 2,
        "title": "Breakthrough",
        "pdf": "M4E_Scheme_Breakthrough.pdf",
        "links": [1, 10, 5]
    },
    {
        "id": 3,
        "title": "Detonate Charges",
        "pdf": "M4E_Scheme_Detonate_Charges.pdf",
        "links": [6, 12, 15]
    },
    {
        "id": 4,
        "title": "Hold this Position",
        "pdf": "M4E_Scheme_Hold_this_Position.pdf",
        "links": [11, 14, 7]
    },
    {
        "id": 5,
        "title": "Frame Job",
        "pdf": "M4E_Scheme_Frame_Job.pdf",
        "links": [9, 13, 1]
    },
    {
        "id": 6,
        "title": "Grave Robbing",
        "pdf": "M4E_Scheme_Grave_Robbing.pdf",
        "links": [1, 3, 15]
    },
    {
        "id": 7,
        "title": "Murder Protege",
        "pdf": "M4E_Scheme_Murder_Protege.pdf",
        "links": [10, 11, 4]
    },
    {
        "id": 8,
        "title": "Plant Evidence",
        "pdf": "M4E_Scheme_Plant_Evidence.pdf",
        "links": [2, 5, 9]
    },
    {
        "id": 9,
        "title": "Reconnoiter",
        "pdf": "M4E_Scheme_Reconnoiter.pdf",
        "links": [13, 14, 1]
    },
    {
        "id": 10,
        "title": "Public Demonstration",
        "pdf": "M4E_Scheme_Public_Demonstration.pdf",
        "links": [1, 2, 7]
    },
    {
        "id": 11,
        "title": "Take one for the Team",
        "pdf": "M4E_Scheme_Take_one_for_the_Team.pdf",
        "links": [4, 7, 10]
    },
    {
        "id": 12,
        "title": "Runic Binding",
        "pdf": "M4E_Scheme_Runic_Binding.pdf",
        "links": [3, 15, 6]
    },
    {
        "id": 13,
        "title": "Scout the Rooftops",
        "pdf": "M4E_Scheme_Scout_the_Rooftops.pdf",
        "links": [1, 9, 5]
    },
    {
        "id": 14,
        "title": "Vendetta",
        "pdf": "M4E_Scheme_Vendetta.pdf",
        "links": [4, 7, 11]
    },
    {
        "id": 15,
        "title": "Take the Highground",
        "pdf": "M4E_Scheme_Take_the_Highground.pdf",
        "links": [3, 6, 12]
    }
];
// Helper to determine if the device is mobile
function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}
/* -------------------------------------------------------------------------- */
/*                                DOM References                              */
/* -------------------------------------------------------------------------- */
const appContainer = document.getElementById('app-container');
const cardView = document.getElementById('card-view');
const cardTitle = document.getElementById('card-title');
const pdfViewer = document.getElementById('pdf-viewer');
const backButton = document.getElementById('back-button');
const overlay = document.getElementById('overlay');
const schemeContainer = document.getElementById('scheme-container');
/* -------------------------------------------------------------------------- */
/*                              App State & Settings                          */
/* -------------------------------------------------------------------------- */
let activeCard = null;
let currentZoom = 1;
let currentPanX = 0;
let currentPanY = 0;
let initialPinchDistance = 0;
let initialPanX = 0;
let initialPanY = 0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_SPEED = 0.005; // For pinch sensitivity
const DOUBLE_TAP_THRESHOLD = 300; // ms for double tap
/* -------------------------------------------------------------------------- */
/*                                  UI Actions                                */
/* -------------------------------------------------------------------------- */
function showCardView(card) {
    activeCard = card;
    cardTitle.textContent = card.title;
    pdfViewer.src = `pdf/${card.pdf}`;
    cardView.classList.add('visible');
    overlay.classList.add('visible');
}
function hideCardView() {
    cardView.classList.remove('visible');
    overlay.classList.remove('visible');
    activeCard = null;
    pdfViewer.src = ''; // Clear PDF to free up memory
}
backButton.addEventListener('click', hideCardView);
overlay.addEventListener('click', hideCardView);
/* -------------------------------------------------------------------------- */
/*                              Pan & Zoom Logic                              */
/* -------------------------------------------------------------------------- */
let lastTouch = null; // Used for double tap detection
let lastPanX = 0;
let lastPanY = 0;
function applyTransform() {
    schemeContainer.style.transform = `translate(${currentPanX}px, ${currentPanY}px) scale(${currentZoom})`;
}
function handlePinchZoom(e) {
    e.preventDefault(); // Prevent default touch behavior (e.g., scrolling)
    const touches = e.touches;
    if (touches.length < 2) return;
    const p1 = { x: touches[0].clientX, y: touches[0].clientY };
    const p2 = { x: touches[1].clientX, y: touches[1].clientY };
    const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    if (initialPinchDistance === 0) {
        initialPinchDistance = distance;
        initialPanX = currentPanX;
        initialPanY = currentPanY;
    } else {
        const scaleChange = distance / initialPinchDistance;
        let newZoom = currentZoom * scaleChange;
        newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
        // Calculate a new pan to keep the center of the pinch in place
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const containerRect = schemeContainer.getBoundingClientRect();
        const centerOnContainerX = midX - containerRect.left;
        const centerOnContainerY = midY - containerRect.top;
        const currentOffsetX = centerOnContainerX - currentPanX;
        const currentOffsetY = centerOnContainerY - currentPanY;
        const newPanX = midX - (currentOffsetX * (newZoom / currentZoom)) - containerRect.left;
        const newPanY = midY - (currentOffsetY * (newZoom / currentZoom)) - containerRect.top;
        currentZoom = newZoom;
        currentPanX = newPanX;
        currentPanY = newPanY;
        initialPinchDistance = distance; // Update for continuous pinch
        applyTransform();
    }
}
function handlePan(e) {
    e.preventDefault(); // Prevent default touch behavior
    const touch = e.touches[0];
    if (!lastPanX || !lastPanY) {
        lastPanX = touch.clientX;
        lastPanY = touch.clientY;
    }
    const deltaX = touch.clientX - lastPanX;
    const deltaY = touch.clientY - lastPanY;
    currentPanX += deltaX;
    currentPanY += deltaY;
    lastPanX = touch.clientX;
    lastPanY = touch.clientY;
    applyTransform();
}
function handleDoubleTap(e) {
    const now = new Date().getTime();
    const timesince = now - (lastTouch || now);
    if (timesince < DOUBLE_TAP_THRESHOLD && timesince > 0) {
        // Double tap detected! Reset zoom and pan
        currentZoom = 1;
        currentPanX = 0;
        currentPanY = 0;
        applyTransform();
        e.preventDefault(); // Prevent browser zoom
    }
    lastTouch = now;
}
schemeContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        handleDoubleTap(e);
        lastPanX = e.touches[0].clientX;
        lastPanY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        initialPinchDistance = 0; // Reset for new pinch gesture
    }
});
schemeContainer.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
        handlePan(e);
    } else if (e.touches.length === 2) {
        handlePinchZoom(e);
    }
});
schemeContainer.addEventListener('touchend', () => {
    lastPanX = 0; // Reset last pan position
    lastPanY = 0;
    initialPinchDistance = 0; // Reset initial pinch distance
});
schemeContainer.addEventListener('wheel', (e) => {
    e.preventDefault(); // Prevent page scrolling
    const scaleAmount = -e.deltaY * ZOOM_SPEED;
    let newZoom = currentZoom + scaleAmount;
    newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    // Calculate new pan to zoom towards the cursor
    const rect = schemeContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    // Adjust pan relative to the mouse position
    currentPanX = mouseX - ((mouseX - currentPanX) * (newZoom / currentZoom));
    currentPanY = mouseY - ((mouseY - currentPanY) * (newZoom / currentZoom));
    currentZoom = newZoom;
    applyTransform();
}, { passive: false }); // Use passive: false to allow preventDefault
/* -------------------------------------------------------------------------- */
/*                               Tree Layout & Render                         */
/* -------------------------------------------------------------------------- */
// Dynamically generate card elements and apply fixed layout
function buildFixedTreeLayout() {
    const cardElements = [];
    const layoutMap = new Map(); // Maps card ID to its grid position
    // L1: 1 card
    layoutMap.set(allCards[0].id, { gridColumn: 5, gridRow: 6 }); // Card ID 1
    // L2: 3 cards
    layoutMap.set(allCards[1].id, { gridColumn: 2, gridRow: 5 }); // Card ID 2
    layoutMap.set(allCards[2].id, { gridColumn: 5, gridRow: 5 }); // Card ID 3
    layoutMap.set(allCards[3].id, { gridColumn: 8, gridRow: 5 }); // Card ID 4
    // L3: 9 cards
    for (let i = 0; i < 9; i++) {
        layoutMap.set(allCards[i + 4].id, { gridColumn: i + 1, gridRow: 4 }); // Cards ID 5-13
    }
    // L4: 2 additional cards for a total of 15
    // These are examples; adjust gridColumn and gridRow as needed for your specific visual layout.
    // Assuming card with index 13 (14th card) and index 14 (15th card) in allCards array
    layoutMap.set(allCards[13].id, { gridColumn: 4, gridRow: 3 }); // Card ID 14 (Vendetta)
    layoutMap.set(allCards[14].id, { gridColumn: 6, gridRow: 3 }); // Card ID 15 (Take the Highground)
    // Create and position card elements
    allCards.forEach(cardData => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('scheme-card');
        cardElement.dataset.cardId = cardData.id;
        const cardTitleElement = document.createElement('h3');
        cardTitleElement.textContent = cardData.title;
        cardElement.appendChild(cardTitleElement);
        const position = layoutMap.get(cardData.id);
        if (position) {
            cardElement.style.gridColumn = position.gridColumn;
            cardElement.style.gridRow = position.gridRow;
        } else {
            // Fallback for cards not explicitly positioned (should not happen with 15 fixed positions now)
            console.warn(`Card with ID ${cardData.id} has no fixed position defined.`);
            cardElement.style.display = 'none'; // Hide if not positioned
        }
        cardElement.addEventListener('click', () => showCardView(cardData));
        cardElements.push(cardElement);
    });
    // Append all card elements to the schemeContainer
    cardElements.forEach(el => schemeContainer.appendChild(el));
}
// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    buildFixedTreeLayout();
    applyTransform(); // Apply initial pan/zoom (reset)
});





