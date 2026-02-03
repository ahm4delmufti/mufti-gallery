const express = require('express');
const db = require('../db');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('../middleware/auth');

// Setup storage for images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// GET all products
router.get('/', (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST new product (Admin Only)
router.post('/', verifyToken, upload.single('image'), (req, res) => {
  const { title, name, description, price, category, stock } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : (req.body.image || null);
  const finalTitle = title || name; // Fallback for old frontend field name

  const sql = "INSERT INTO products (title, description, price, category, image, stock) VALUES (?, ?, ?, ?, ?, ?)";
  const params = [finalTitle, description, price, category, image, stock];

  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: "Product created" });
  });
});

// DELETE product (Admin Only)
router.delete('/:id', verifyToken, (req, res) => {
  db.run("DELETE FROM products WHERE id = ?", [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Product deleted", changes: this.changes });
  });
});

module.exports = router;
