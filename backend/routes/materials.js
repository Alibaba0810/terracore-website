/**
 * TerraCore Solutions Backend
 * Building Materials API
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

// Get all materials (public)
router.get('/', (req, res) => {
  try {
    const { category, status, inStock, limit, offset } = req.query;
    
    let query = 'SELECT * FROM materials WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    } else {
      query += ' AND status = ?';
      params.push('active');
    }
    if (inStock !== undefined) {
      query += ' AND in_stock = ?';
      params.push(inStock === 'true' ? 1 : 0);
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

    const materials = db.prepare(query).all(...params);
    res.json({ success: true, data: materials });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch materials' });
  }
});

// Get single material by ID (public)
router.get('/:id', (req, res) => {
  try {
    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
    
    if (!material) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }

    res.json({ success: true, data: material });
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch material' });
  }
});

// Get material categories (public)
router.get('/categories/list', (req, res) => {
  try {
    const categories = db.prepare('SELECT DISTINCT category FROM materials ORDER BY category').all();
    res.json({ 
      success: true, 
      data: categories.map(c => c.category) 
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// Create new material (admin only)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { 
      name, description, category, price_min, price_max, 
      image_url, in_stock, status 
    } = req.body;

    // Validation
    if (!name || !category) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and category are required' 
      });
    }

    const result = db.prepare(`
      INSERT INTO materials (name, description, category, price_min, price_max, image_url, in_stock, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      description || null,
      category,
      price_min || null,
      price_max || null,
      image_url || null,
      in_stock !== undefined ? (in_stock ? 1 : 0) : 1,
      status || 'active'
    );

    res.status(201).json({ 
      success: true, 
      message: 'Material created successfully',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ success: false, error: 'Failed to create material' });
  }
});

// Update material (admin only)
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { 
      name, description, category, price_min, price_max, 
      image_url, in_stock, status 
    } = req.body;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }

    const result = db.prepare(`
      UPDATE materials SET 
        name = ?, description = ?, category = ?, price_min = ?,
        price_max = ?, image_url = ?, in_stock = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || existing.name,
      description !== undefined ? description : existing.description,
      category || existing.category,
      price_min !== undefined ? price_min : existing.price_min,
      price_max !== undefined ? price_max : existing.price_max,
      image_url !== undefined ? image_url : existing.image_url,
      in_stock !== undefined ? (in_stock ? 1 : 0) : existing.in_stock,
      status || existing.status,
      id
    );

    res.json({ success: true, message: 'Material updated successfully' });
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ success: false, error: 'Failed to update material' });
  }
});

// Delete material (admin only)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }

    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ success: false, error: 'Failed to delete material' });
  }
});

// Search materials (public)
router.get('/search', (req, res) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    
    let query = 'SELECT * FROM materials WHERE status = ?';
    const params = ['active'];

    if (q) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (minPrice) {
      query += ' AND price_min >= ?';
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ' AND price_max <= ?';
      params.push(parseFloat(maxPrice));
    }

    query += ' ORDER BY created_at DESC';

    const materials = db.prepare(query).all(...params);
    res.json({ success: true, data: materials });
  } catch (error) {
    console.error('Error searching materials:', error);
    res.status(500).json({ success: false, error: 'Failed to search materials' });
  }
});

module.exports = router;
