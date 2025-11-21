const express = require('express');
const cors = require('cors');
const mysql = require('./config/database.js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all agents for a user
app.get('/api/agents', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const connection = await mysql.getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM agents WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    connection.release();
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all phone numbers for a user
app.get('/api/phone-numbers', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const connection = await mysql.getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM phone_numbers WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    connection.release();
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching phone numbers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all campaigns for a user
app.get('/api/campaigns', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const connection = await mysql.getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    connection.release();
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Simple server is running on port ${PORT}`);
});