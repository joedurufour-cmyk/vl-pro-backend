"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const DB_DIR = path_1.default.join(__dirname, '..', 'data');
const DB_PATH = process.env.DATABASE_PATH || path_1.default.join(DB_DIR, 'visual-lab.db');
// Ensure data directory exists
if (!fs_1.default.existsSync(DB_DIR)) {
    fs_1.default.mkdirSync(DB_DIR, { recursive: true });
}
const db = new sqlite3_1.default.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Database connection failed:', err);
    }
    else {
        console.log('Connected to SQLite database:', DB_PATH);
    }
});
function initializeDatabase() {
    // Blocks table
    db.run(`
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      nombre TEXT NOT NULL,
      raw_text TEXT,
      personaje TEXT,
      fisico TEXT,
      vestimenta TEXT,
      lighting TEXT,
      background TEXT,
      otros TEXT,
      parametros TEXT,
      param_string TEXT,
      negativos TEXT,
      chaos TEXT,
      ar TEXT,
      stylize TEXT,
      version TEXT,
      starred INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Logs table
    db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      result TEXT,
      status TEXT,
      chaos TEXT,
      stylize TEXT,
      ar TEXT,
      tags TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Presets table
    db.run(`
    CREATE TABLE IF NOT EXISTS presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      config TEXT NOT NULL,
      is_duo INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Users table (simple, no auth - just device ID)
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      device_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    console.log('Database tables initialized');
}
exports.default = db;
