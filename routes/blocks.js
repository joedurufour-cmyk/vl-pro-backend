"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../db"));
const router = express_1.default.Router();
// Get all blocks for user
router.get('/', (req, res) => {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const starredOnly = req.query.starred === '1';
    let query = 'SELECT * FROM blocks WHERE user_id = ?';
    const params = [userId];
    if (starredOnly) {
        query += ' AND starred = 1';
    }
    query += ' ORDER BY created_at DESC';
    db_1.default.all(query, params, (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
// Create block
router.post('/', (req, res) => {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const block = req.body;
    const sql = `INSERT INTO blocks
    (user_id, nombre, raw_text, personaje, fisico, vestimenta, lighting, background, otros, parametros, param_string, negativos, chaos, ar, stylize, version, starred)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        userId, block.nombre, block.raw_text, block.personaje, block.fisico,
        block.vestimenta, block.lighting, block.background, block.otros,
        JSON.stringify(block.parametros), block.param_string,
        JSON.stringify(block.negativos), block.chaos, block.ar,
        block.stylize, block.version, block.starred ? 1 : 0
    ];
    db_1.default.run(sql, params, function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...block });
    });
});
// Update block
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const block = req.body;
    const sql = `UPDATE blocks SET
    nombre = ?, raw_text = ?, personaje = ?, fisico = ?, vestimenta = ?,
    lighting = ?, background = ?, otros = ?, parametros = ?, param_string = ?,
    negativos = ?, chaos = ?, ar = ?, stylize = ?, version = ?, starred = ?
    WHERE id = ?`;
    const params = [
        block.nombre, block.raw_text, block.personaje, block.fisico,
        block.vestimenta, block.lighting, block.background, block.otros,
        JSON.stringify(block.parametros), block.param_string,
        JSON.stringify(block.negativos), block.chaos, block.ar,
        block.stylize, block.version, block.starred ? 1 : 0, id
    ];
    db_1.default.run(sql, params, function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ updated: this.changes });
    });
});
// Delete block
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db_1.default.run('DELETE FROM blocks WHERE id = ?', [id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});
// Export all blocks for user
router.get('/export/all', (req, res) => {
    const userId = req.headers['x-user-id'] || 'anonymous';
    db_1.default.all('SELECT * FROM blocks WHERE user_id = ?', [userId], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="blocks-export.json"');
        res.json(rows);
    });
});
exports.default = router;
