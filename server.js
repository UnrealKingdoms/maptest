const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, 'coordinates.json');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Load existing coordinates
app.get('/coordinates', (req, res) => {
    fs.readFile(DATA_FILE, (err, data) => {
        if (err) return res.status(500).send('Error reading data');
        res.json(JSON.parse(data || '[]'));
    });
});

// Save new coordinates
app.post('/save', (req, res) => {
    const { x, y, radius, type } = req.body; // Include 'type' field

    fs.readFile(DATA_FILE, (err, data) => {
        let coordinates = [];
        if (!err) coordinates = JSON.parse(data || '[]');

        // Check for overlapping region
        if (coordinates.some(coord => {
            const distance = Math.sqrt((coord.x - x) ** 2 + (coord.y - y) ** 2);
            return distance <= (coord.radius + radius);
        })) {
            return res.status(400).json({ message: 'Coordinate already saved' });
        }

        // Add new position with type and radius
        coordinates.push({ x, y, radius, type });
        fs.writeFile(DATA_FILE, JSON.stringify(coordinates, null, 2), err => {
            if (err) return res.status(500).send('Failed to save data');
            res.status(200).send('Coordinate saved successfully');
        });
    });
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
