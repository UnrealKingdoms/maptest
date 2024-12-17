const canvas = document.getElementById('canvas');
const image = document.getElementById('main-image');
const popup = document.getElementById('popup');
const body = document.body;

let ctx = canvas.getContext('2d');
let coordinates = [];
let selectedOption = null; // Track selected menu option

const COLORS = {
    ruby: 'rgba(224, 17, 95, 0.7)',   // Semi-transparent ruby red
    gold: 'rgba(255, 215, 0, 0.7)',  // Semi-transparent gold
    diamond: 'rgba(192, 192, 192, 0.7)' // Semi-transparent silver
};

const RADII = {
    ruby: 25,
    gold: 50,
    diamond: 100
};

// Adjust canvas size to match the image
image.onload = () => {
    canvas.width = image.width;
    canvas.height = image.height;
    loadCoordinates();
};

// Load saved coordinates
async function loadCoordinates() {
    const response = await fetch('/coordinates');
    coordinates = await response.json();
    drawDots();
}

// Draw saved regions
function drawDots() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before redrawing

    coordinates.forEach(coord => {
        let fillColor = 'red'; // Default color for invalid or missing types

        // Determine color based on 'type'
        if (coord.type === 'ruby') {
            fillColor = 'rgba(224, 17, 95, 0.7)'; // Ruby color
        } else if (coord.type === 'gold') {
            fillColor = 'rgba(255, 215, 0, 0.7)'; // Gold color
        } else if (coord.type === 'diamond') {
            fillColor = 'rgba(192, 192, 192, 0.7)'; // Silver color
        }

        // Draw the circular region
        if (coord.radius) {
            ctx.beginPath();
            ctx.fillStyle = fillColor; // Use semi-transparent color for the region
            ctx.arc(coord.x, coord.y, coord.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }

        // Draw a fully opaque center dot
        ctx.beginPath();
        ctx.fillStyle = fillColor.replace('0.7', '1.0'); // Make center dot fully opaque
        ctx.arc(coord.x, coord.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    });
}



// Mouse coordinate display logic
const coordDisplay = document.createElement('div');
coordDisplay.id = 'coord-display';
coordDisplay.style.position = 'absolute';
coordDisplay.style.background = 'rgba(0,0,0,0.7)';
coordDisplay.style.color = 'white';
coordDisplay.style.padding = '3px 6px';
coordDisplay.style.borderRadius = '5px';
coordDisplay.style.fontSize = '12px';
coordDisplay.style.display = 'none';
coordDisplay.style.zIndex = '999';
body.appendChild(coordDisplay);

// Mousemove event listener to display coordinates
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);

    coordDisplay.textContent = `X: ${x}, Y: ${y}`;
    coordDisplay.style.left = `${event.clientX + 10}px`;
    coordDisplay.style.top = `${event.clientY + 10}px`;
    coordDisplay.style.display = 'block';
});

canvas.addEventListener('mouseleave', () => {
    coordDisplay.style.display = 'none';
});

// Popup handling logic
let lastClick = { x: null, y: null, radius: 0, type: null };

canvas.addEventListener('click', (event) => {
    if (!selectedOption) {
        alert('Please select an option from the menu.');
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);
    const radius = RADII[selectedOption];

    // Check for overlapping region
    if (isRangeAlreadyPurchased(x, y, radius)) {
        showPopup(event.clientX, event.clientY, 'Not for Sale');
        return;
    }

    lastClick = { x, y, radius, type: selectedOption };

    showPopup(event.clientX, event.clientY, `Selected Coordinates: (${x}, ${y})`, true);
});

// Check if the clicked region overlaps with an existing one
function isRangeAlreadyPurchased(x, y, radius) {
    return coordinates.some(coord => {
        const distance = Math.sqrt((coord.x - x) ** 2 + (coord.y - y) ** 2);
        return distance <= (coord.radius + radius);
    });
}

// Show popup with message
function showPopup(left, top, message, purchase = false) {
    popup.innerHTML = `
        <p>${message}</p>
        ${purchase ? '<button id="purchase-btn">Purchase</button>' : '<button id="close-btn">Close</button>'}
    `;
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    popup.style.display = 'block';

    if (purchase) {
        document.getElementById('purchase-btn').onclick = saveCoordinates;
    } else {
        document.getElementById('close-btn').onclick = () => {
            popup.style.display = 'none';
        };
    }
}

// Save coordinates to server
async function saveCoordinates() {
    const response = await fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastClick),
    });

    if (response.ok) {
        popup.style.display = 'none'; // Close popup
        loadCoordinates(); // Reload dots
    } else {
        const error = await response.json();
        alert(error.message);
    }
}

// Highlight selected menu item
const menuItems = document.querySelectorAll('.menu-item');

menuItems.forEach(item => {
    item.addEventListener('click', () => {
        menuItems.forEach(menu => menu.classList.remove('active'));
        item.classList.add('active');
        selectedOption = item.dataset.option; // Update selected option
        console.log(`Selected option: ${selectedOption}`);
    });
});
