/**
 * TerraCore Solutions Backend
 * Contact form submissions API
 */

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const db = require('../database');

// Get all contact submissions (admin only)
router.get('/', (req, res) => {
  try {
    const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch contacts' });
  }
});

// Get single contact by ID (admin only)
router.get('/:id', (req, res) => {
  try {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    res.json({ success: true, data: contact });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch contact' });
  }
});

// Submit a new contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, and message are required' 
      });
    }

    // Insert into database
    const result = db.prepare(`
      INSERT INTO contacts (name, email, phone, subject, message)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, email, phone || null, subject || null, message);

    const contactId = result.lastInsertRowid;

    // Try to send email notification (optional - won't fail if email fails)
    try {
      if (process.env.SMTP_HOST) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@terracore.com',
          to: process.env.ADMIN_EMAIL || 'info@eloke.co',
          subject: `New Contact Form Submission: ${subject || 'No Subject'}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Subject:</strong> ${subject || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          `
        });
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      // Don't fail the request if email fails
    }

    res.status(201).json({ 
      success: true, 
      message: 'Message sent successfully!',
      data: { id: contactId }
    });
  } catch (error) {
    console.error('Error submitting contact:', error);
    res.status(500).json({ success: false, error: 'Failed to submit message' });
  }
});

// Update contact status (admin only)
router.patch('/:id', (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const result = db.prepare(`
      UPDATE contacts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    res.json({ success: true, message: 'Contact status updated' });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ success: false, error: 'Failed to update contact' });
  }
});

// Delete contact (admin only)
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ success: false, error: 'Failed to delete contact' });
  }
});

module.exports = router;
