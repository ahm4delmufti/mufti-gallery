const express = require('express');
const db = require('../db');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');

router.post('/', (req, res) => {
  const { name, email, subject, message } = req.body;

  const sql = "INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)";
  const params = [name, email, subject, message];

  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: "Message sent successfully" });
  });
});

// GET all messages (Admin Only)
router.get('/', verifyToken, (req, res) => {
  db.all("SELECT * FROM messages ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

module.exports = router;

