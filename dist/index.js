"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const blocks_1 = __importDefault(require("./routes/blocks"));
const logs_1 = __importDefault(require("./routes/logs"));
const presets_1 = __importDefault(require("./routes/presets"));
const kimi_1 = __importDefault(require("./routes/kimi"));
const vcot_1 = __importDefault(require("./routes/vcot"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)({
    origin: '*', // In production, restrict to your domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
// API Secret middleware for sensitive routes
const requireSecret = (req, res, next) => {
    const secret = req.headers['x-api-secret'] || req.query.secret;
    if (secret !== process.env.API_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '8.0.0', timestamp: new Date().toISOString() });
});
// Routes
app.use('/api/blocks', requireSecret, blocks_1.default);
app.use('/api/logs', requireSecret, logs_1.default);
app.use('/api/presets', requireSecret, presets_1.default);
app.use('/api/kimi', requireSecret, kimi_1.default);
app.use('/api/vcot', requireSecret, vcot_1.default);
// Public: translate endpoint (no secret needed for basic usage)
app.use('/api/translate', kimi_1.default);
// Initialize database
(0, db_1.initializeDatabase)();
app.listen(PORT, () => {
    console.log(`Visual Lab PRO Backend v8 running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
exports.default = app;
