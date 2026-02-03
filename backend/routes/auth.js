const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
require('dotenv').config();

const router = express.Router();

// Simple Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // For initial setup, we'll check against .env or a default
  // In production, you'd check from the `admins` table
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ id: 1, username: username }, process.env.JWT_SECRET, {
      expiresIn: 86400 // 24 hours
    });
    return res.json({ auth: true, token: token });
  }

  res.status(401).json({ auth: false, message: "Invalid credentials" });
});

module.exports = router;
