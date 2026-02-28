/**
 * TerraCore Solutions Backend
 * Properties API
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const jwt = require('jsonwebtoken');

// Middleware to check authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'terracore-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Get all properties (public)
router.get('/', (req, res) => {
  try {
    const { type, status, featured, limit, offset } = req.query;
    
    let query = 'SELECT * FROM properties WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    } else {
      query += ' AND status = ?';
      params.push('active');
    }
    if (featured) {
      query += ' AND featured = ?';
      params.push(featured === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    if (offset) {
      query += ' OFFSET ?';
      params.push(parseInt(offset));
    }

    const properties = db.prepare(query).all(...params);
    
    // Parse features JSON
    const parsedProperties = properties.map(p => ({
      ...p,
      features: p.features ? JSON.parse(p.features) : []
    }));

    res.json({ success: true, data: parsedProperties });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch properties' });
  }
});

// Get single property by ID (public)
router.get('/:id', (req, res) => {
  try {
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
    
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    // Parse features JSON
    property.features = property.features ? JSON.parse(property.features) : [];

    res.json({ success: true, data: property });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch property' });
  }
});

// Create new property (admin only)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { 
      title, description, type, price, location, area_sqm, 
      bedrooms, bathrooms, features, image_url, status, featured 
    } = req.body;

    // Validation
    if (!title || !type || !price || !location) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title, type, price, and location are required' 
      });
    }

    const result = db.prepare(`
      INSERT INTO properties (title, description, type, price, location, area_sqm, bedrooms, bathrooms, features, image_url, status, featured, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description || null,
      type,
      price,
      location,
      area_sqm || null,
      bedrooms || null,
      bathrooms || null,
      features ? JSON.stringify(features) : null,
      image_url || null,
      status || 'active',
      featured ? 1 : 0,
      req.user.id
    );

    res.status(201).json({ 
      success: true, 
      message: 'Property created successfully',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ success: false, error: 'Failed to create property' });
  }
});

// Update property (admin only)
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { 
      title, description, type, price, location, area_sqm, 
      bedrooms, bathrooms, features, image_url, status, featured 
    } = req.body;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    const result = db.prepare(`
      UPDATE properties SET 
        title = ?, description = ?, type = ?, price = ?, location = ?,
        area_sqm = ?, bedrooms = ?, bathrooms = ?, features = ?,
        image_url = ?, status = ?, featured = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title || existing.title,
      description !== undefined ? description : existing.description,
      type || existing.type,
      price || existing.price,
      location || existing.location,
      area_sqm !== undefined ? area_sqm : existing.area_sqm,
      bedrooms !== undefined ? bedrooms : existing.bedrooms,
      bathrooms !== undefined ? bathrooms : existing.bathrooms,
      features ? JSON.stringify(features) : existing.features,
      image_url !== undefined ? image_url : existing.image_url,
      status || existing.status,
      featured !== undefined ? (featured ? 1 : 0) : existing.featured,
      id
    );

    res.json({ success: true, message: 'Property updated successfully' });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ success: false, error: 'Failed to update property' });
  }
});

// Delete property (admin only)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM properties WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ success: false, error: 'Failed to delete property' });
  }
});

// Search properties (public)
router.get('/search', (req, res) => {
  try {
    const { q, minPrice, maxPrice, location, type } = req.query;
    
    let query = 'SELECT * FROM properties WHERE status = ?';
    const params = ['active'];

    if (q) {
      query += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    if (minPrice) {
      query += ' AND price >= ?';
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(parseFloat(maxPrice));
    }
    if (location) {
      query += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const properties = db.prepare(query).all(...params);
    
    const parsedProperties = properties.map(p => ({
      ...p,
      features: p.features ? JSON.parse(p.features) : []
    }));

    res.json({ success: true, data: parsedProperties });
  } catch (error) {
    console.error('Error searching properties:', error);
    res.status(500).json({ success: false, error: 'Failed to search properties' });
  }
});

module.exports = router;
