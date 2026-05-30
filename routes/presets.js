"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../db"));
const router = express_1.default.Router();
// Get all presets for user
router.get('/', (req, res) => {
    const userId = req.headers['x-user-id'] || 'anonymous';
    db_1.default.all('SELECT * FROM presets WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows.map((r) => ({ ...r, config: JSON.parse(r.config) })));
    });
});
// Create preset
router.post('/', (req, res) => {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const { name, config, is_duo } = req.body;
    db_1.default.run('INSERT INTO presets (user_id, name, config, is_duo) VALUES (?, ?, ?, ?)', [userId, name, JSON.stringify(config), is_duo ? 1 : 0], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, config, is_duo });
    });
});
// Delete preset
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db_1.default.run('DELETE FROM presets WHERE id = ?', [id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});
exports.default = router;
