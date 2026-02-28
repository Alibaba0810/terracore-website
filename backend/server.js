/**
 * TerraCore Solutions Backend
 * Main server entry point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database
// const db = require('./database');

// Import routes
const contactRoutes = require('./routes/contact');
const propertiesRoutes = require('./routes/properties');
const materialsRoutes = require('./routes/materials');
const newsletterRoutes = require('./routes/newsletter');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the parent directory (frontend)
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.use('/api/contact', contactRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/auth', authRoutes);

// Serve frontend for any unmatched routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`TerraCore Solutions API Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
