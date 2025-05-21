// Import required modules
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Database setup
const db = new sqlite3.Database('./reminders.db', (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

// Create reminders table if it doesn't exist
function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      message TEXT NOT NULL,
      method TEXT NOT NULL CHECK (method IN ('sms', 'email')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Table creation error:', err.message);
    }
  });
}

// POST endpoint to create a new reminder
app.post('/api/reminders', (req, res) => {
  const { date, time, message, method } = req.body;

  // Validate required fields
  if (!date || !time || !message || !method) {
    return res.status(400).json({ 
      error: 'Missing required fields. Please provide date, time, message, and method.' 
    });
  }

  // Validate reminder method
  if (!['sms', 'email'].includes(method)) {
    return res.status(400).json({ 
      error: 'Invalid method. Only "sms" or "email" are allowed.' 
    });
  }

  // Insert reminder into database
  db.run(
    `INSERT INTO reminders (date, time, message, method) VALUES (?, ?, ?, ?)`,
    [date, time, message, method],
    function(err) {
      if (err) {
        console.error('Database insertion error:', err);
        return res.status(500).json({ error: 'Failed to save reminder.' });
      }
      
      res.status(201).json({ 
        success: true,
        reminderId: this.lastID,
        message: 'Reminder successfully saved!'
      });
    }
  );
});

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Close database connection when server stops
process.on('SIGINT', () => {
  db.close();
  process.exit();
});