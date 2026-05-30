"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../db"));
const router = express_1.default.Router();
// Get all logs for user
router.get('/', (req, res) => {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    db_1.default.all('SELECT * FROM logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [userId, limit, offset], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
// Create log
router.post('/', (req, res) => {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const log = req.body;
    const sql = `INSERT INTO logs
    (user_id, prompt, result, status, chaos, stylize, ar, tags, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        userId, log.prompt, log.result, log.status,
        log.chaos, log.stylize, log.ar,
        JSON.stringify(log.tags), log.notes
    ];
    db_1.default.run(sql, params, function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...log });
    });
});
// Update log status
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { status, result, notes } = req.body;
    db_1.default.run('UPDATE logs SET status = ?, result = ?, notes = ? WHERE id = ?', [status, result, notes, id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ updated: this.changes });
    });
});
// Delete log
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db_1.default.run('DELETE FROM logs WHERE id = ?', [id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});
// Export logs
router.get('/export/all', (req, res) => {
    const userId = req.headers['x-user-id'] || 'anonymous';
    db_1.default.all('SELECT * FROM logs WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="logs-export.json"');
        res.json(rows);
    });
});
exports.default = router;
