/**
 * TerraCore Solutions Backend
 * Authentication API
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

// JWT secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'terracore-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Register a new user
router.post('/register', (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, and name are required' 
      });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert user
    const result = db.prepare(`
      INSERT INTO users (email, password, name, role)
      VALUES (?, ?, ?, ?)
    `).run(email.toLowerCase(), hashedPassword, name, 'user');

    // Generate token
    const token = jwt.sign(
      { id: result.lastInsertRowid, email: email.toLowerCase(), name, role: 'user' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully',
      data: { 
        token,
        user: { id: result.lastInsertRowid, email: email.toLowerCase(), name, role: 'user' }
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, error: 'Failed to register user' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ 
      success: true, 
      message: 'Login successful',
      data: { 
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, error: 'Failed to log in' });
  }
});

// Get current user
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ success: false, error: 'Invalid token' });
      }

      const dbUser = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(user.id);
      if (!dbUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({ success: true, data: dbUser });
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

// Change password
router.post('/change-password', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Current password and new password are required' 
      });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ success: false, error: 'Invalid token' });
      }

      const dbUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      if (!dbUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Verify current password
      const isPasswordValid = bcrypt.compareSync(currentPassword, dbUser.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = bcrypt.hashSync(newPassword, 10);

      // Update password
      db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(hashedPassword, user.id);

      res.json({ success: true, message: 'Password changed successfully' });
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

// Get all users (admin only)
router.get('/users', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ success: false, error: 'Invalid token' });
      }

      if (user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      const users = db.prepare('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC').all();
      res.json({ success: true, data: users });
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
});

module.exports = router;
