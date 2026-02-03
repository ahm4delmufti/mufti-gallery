const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database.');
    
    // Create tables
    db.serialize(() => {
      // Products table
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        title_ar TEXT,
        title_it TEXT,
        title_fr TEXT,
        title_es TEXT,
        title_zh TEXT,
        description TEXT,
        description_ar TEXT,
        description_it TEXT,
        description_fr TEXT,
        description_es TEXT,
        description_zh TEXT,
        price REAL,
        category TEXT,
        image TEXT,
        stock INTEGER DEFAULT 1
      )`);

      // Contact messages table
      db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        subject TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Admin table (for simplicity, we'll store basic admin here)
      db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
      )`);
    });
  }
});

module.exports = db;
