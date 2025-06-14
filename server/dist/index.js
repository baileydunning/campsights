"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/api/v1/campsites', (_req, res) => {
    const filePath = path_1.default.join(__dirname, '../data/campsites.json');
    fs_1.default.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading campsites.json:', err);
            return res.status(500).json({ error: 'Unable to load campsites' });
        }
        try {
            const campsites = JSON.parse(data);
            res.json(campsites);
        }
        catch (parseError) {
            console.error('Error parsing campsite data:', parseError);
            res.status(500).json({ error: 'Invalid campsite data format' });
        }
    });
});
app.post('/api/v1/campsites', (req, res) => {
    const filePath = path_1.default.join(__dirname, '../data/campsites.json');
    const newCampsite = req.body;
    fs_1.default.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading campsites.json:', err);
            return res.status(500).json({ error: 'Unable to load campsites' });
        }
        try {
            const campsites = JSON.parse(data);
            campsites.push(newCampsite);
            fs_1.default.writeFile(filePath, JSON.stringify(campsites, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error('Error writing to campsites.json:', writeErr);
                    return res.status(500).json({ error: 'Unable to save campsite' });
                }
                res.status(201).json(newCampsite);
            });
        }
        catch (parseError) {
            console.error('Error parsing campsite data:', parseError);
            res.status(500).json({ error: 'Invalid campsite data format' });
        }
    });
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
