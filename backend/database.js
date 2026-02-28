/**
 * TerraCore Solutions Backend
 * Database setup using sql.js (pure JavaScript SQLite)
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'terracore.db');

let db = null;
let SQL = null;

// Synchronous-looking wrapper that handles async initialization
class DatabaseWrapper {
  constructor() {
    this.ready = false;
    this.pendingOps = [];
  }
  
  async _ensureReady() {
    if (this.ready) return;
    
    if (!SQL) {
      SQL = await initSqlJs();
    }
    
    if (!db) {
      // Load existing database if it exists
      if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
      } else {
        db = new SQL.Database();
        await this._initTables();
      }
    }
    
    this.ready = true;
    
    // Process any pending operations
    for (const op of this.pendingOps) {
      op.resolve();
    }
    this.pendingOps = [];
  }
  
  async _initTables() {
    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        price REAL NOT NULL,
        location TEXT NOT NULL,
        area_sqm REAL,
        bedrooms INTEGER,
        bathrooms INTEGER,
        features TEXT,
        image_url TEXT,
        status TEXT DEFAULT 'active',
        featured INTEGER DEFAULT 0,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        price_min REAL,
        price_max REAL,
        image_url TEXT,
        in_stock INTEGER DEFAULT 1,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        subject TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'unread',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS newsletter (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        subscribed INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT,
        message TEXT NOT NULL,
        image_url TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed initial admin user if not exists
    const adminResult = db.exec("SELECT id FROM users WHERE email = 'admin@terracore.com'");
    if (adminResult.length === 0 || adminResult[0].values.length === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.run(
        "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
        ['admin@terracore.com', hashedPassword, 'Administrator', 'admin']
      );
      console.log('Admin user created: admin@terracore.com / admin123');
    }

    // Seed sample properties if none exist
    const propResult = db.exec('SELECT COUNT(*) as count FROM properties');
    const propCount = propResult.length > 0 && propResult[0].values.length > 0 ? propResult[0].values[0][0] : 0;
    
    if (propCount === 0) {
      db.run(
        `INSERT INTO properties (title, description, type, price, location, area_sqm, bedrooms, bathrooms, features, image_url, status, featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Transekulu Apartment', 'The Building contains 20 large rooms suitable for AIR BNB or Large Families', 'apartment', 100000000, 'Transekulu, Enugu', 600, 20, 10, JSON.stringify(['Airbnb Ready', 'Large Families', 'Spacious']), '/img/property3.png', 'active', 1]
      );
      
      db.run(
        `INSERT INTO properties (title, description, type, price, location, area_sqm, bedrooms, bathrooms, features, image_url, status, featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Lagos Victoria Island Flat', 'Luxury 3-bedroom flat in the heart of Victoria Island', 'flat', 75000000, 'Victoria Island, Lagos', 250, 3, 3, JSON.stringify(['Modern Finishing', 'Security', 'Parking']), '/img/house1.png', 'active', 1]
      );
      
      db.run(
        `INSERT INTO properties (title, description, type, price, location, area_sqm, bedrooms, bathrooms, features, image_url, status, featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Enugu Residential House', 'Beautiful 4-bedroom bungalow in a quiet neighborhood', 'house', 45000000, 'New Haven, Enugu', 400, 4, 3, JSON.stringify(['Garden', 'Garage', 'Security']), '/img/house2.png', 'active', 0]
      );
      
      console.log('Sample properties seeded');
    }

    // Seed sample building materials if none exist
    const matResult = db.exec('SELECT COUNT(*) as count FROM materials');
    const matCount = matResult.length > 0 && matResult[0].values.length > 0 ? matResult[0].values[0][0] : 0;
    
    if (matCount === 0) {
      db.run(
        `INSERT INTO materials (name, description, category, price_min, price_max, image_url, in_stock)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Luxury Foreign Doors', 'For your luxury finishing with our Quality Foreign Doors', 'doors', 110000, 700000, '/img/cream double door.jpeg', 1]
      );
      
      db.run(
        `INSERT INTO materials (name, description, category, price_min, price_max, image_url, in_stock)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Luxury Foreign Lights', 'For your High Quality standard Luxurious Lightings', 'lighting', 800, 200000, '/img/Black single door.jpeg', 1]
      );
      
      db.run(
        `INSERT INTO materials (name, description, category, price_min, price_max, image_url, in_stock)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['High Quality Plumbings', 'For your Top-notch Quality Plumbing materials', 'plumbing', 4000, 20000, '/img/wood door.jpeg', 1]
      );
      
      console.log('Sample building materials seeded');
    }

    // Seed sample testimonials if none exist
    const testResult = db.exec('SELECT COUNT(*) as count FROM testimonials');
    const testCount = testResult.length > 0 && testResult[0].values.length > 0 ? testResult[0].values[0][0] : 0;
    
    if (testCount === 0) {
      db.run(
        `INSERT INTO testimonials (name, role, message, status) VALUES (?, ?, ?, ?)`,
        ['Mr. Romanus', 'Client', 'I had a seamless and professional experience with TerraCore and their team. They efficiently leased out my unit, and their communication throughout the process was excellent. I highly recommend them to anyone looking for reliable and expert service.', 'approved']
      );
      
      db.run(
        `INSERT INTO testimonials (name, role, message, status) VALUES (?, ?, ?, ?)`,
        ['Mr. Emmanuel', 'Property Investor', 'Finding the right home in Lagos can be overwhelming, but TerraCore made it so easy. They listened to my preferences and found me a property that exceeded my expectations. Their professionalism and attention to detail were top-notch.', 'approved']
      );
      
      db.run(
        `INSERT INTO testimonials (name, role, message, status) VALUES (?, ?, ?, ?)`,
        ['Mr. Martins', 'Road Constructor', 'TerraCore Solutions provided an accurate and detailed valuation for my property, giving me the confidence I needed to make informed decisions. Their expertise and professionalism were evident from start to finish.', 'approved']
      );
      
      console.log('Sample testimonials seeded');
    }

    // Save database to file
    this._saveDatabase();
    
    console.log('Database initialized successfully');
  }
  
  _saveDatabase() {
    if (db) {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    }
  }
  
  prepare(sql) {
    const self = this;
    
    // Return a proxy that waits for db to be ready
    return {
      run: function(...params) {
        if (!self.ready) {
          // Queue the operation
          throw new Error('Database not ready');
        }
        db.run(sql, params);
        self._saveDatabase();
        return { changes: db.getRowsModified() };
      },
      get: function(...params) {
        if (!self.ready) {
          throw new Error('Database not ready');
        }
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all: function(...params) {
        if (!self.ready) {
          throw new Error('Database not ready');
        }
        const results = [];
        const stmt = db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  }
  
  exec(sql) {
    if (!this.ready) {
      throw new Error('Database not ready');
    }
    db.run(sql);
    this._saveDatabase();
  }
  
  pragma(pragma) {
    // sql.js doesn't support pragma the same way
  }
}

// Create and initialize the database wrapper
const dbWrapper = new DatabaseWrapper();

// Initialize asynchronously and log when ready
dbWrapper._ensureReady().then(() => {
  console.log('Database is ready');
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

module.exports = dbWrapper;
