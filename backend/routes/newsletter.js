/**
 * TerraCore Solutions Backend
 * Newsletter API
 */

const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all newsletter subscribers (admin only)
router.get('/', (req, res) => {
  try {
    const subscribers = db.prepare('SELECT * FROM newsletter ORDER BY created_at DESC').all();
    res.json({ success: true, data: subscribers });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch subscribers' });
  }
});

// Subscribe to newsletter
router.post('/subscribe', (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Check if already subscribed
    const existing = db.prepare('SELECT * FROM newsletter WHERE email = ?').get(email.toLowerCase());
    
    if (existing) {
      if (existing.subscribed) {
        return res.status(400).json({ success: false, error: 'Email already subscribed' });
      }
      // Reactivate if previously unsubscribed
      db.prepare('UPDATE newsletter SET subscribed = 1 WHERE email = ?').run(email.toLowerCase());
      return res.json({ success: true, message: 'Newsletter subscription reactivated!' });
    }

    // Insert new subscriber
    const result = db.prepare('INSERT INTO newsletter (email, subscribed) VALUES (?, 1)').run(email.toLowerCase());

    res.status(201).json({ success: true, message: 'Successfully subscribed to newsletter!' });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ success: false, error: 'Failed to subscribe' });
  }
});

// Unsubscribe from newsletter
router.post('/unsubscribe', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const result = db.prepare('UPDATE newsletter SET subscribed = 0 WHERE email = ?').run(email.toLowerCase());

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    res.json({ success: true, message: 'Successfully unsubscribed from newsletter' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ success: false, error: 'Failed to unsubscribe' });
  }
});

// Get subscriber count (admin only)
router.get('/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM newsletter WHERE subscribed = 1').get();
    res.json({ 
      success: true, 
      data: { 
        totalSubscribers: total.count 
      } 
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

module.exports = router;
