const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://neondb_owner:npg_Hu49yJGLTBOo@ep-nameless-dust-adw9vo25-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

app.get('/test-devices', async (req, res) => {
  try {
    console.log('Testing devices endpoint...');
    const result = await pool.query('SELECT d.*, u.username FROM devices d LEFT JOIN users u ON d.user_id = u.id ORDER BY d.name');
    console.log('Query successful, found', result.rows.length, 'devices');
    res.json({
      success: true,
      count: result.rows.length,
      devices: result.rows
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/test-energy', async (req, res) => {
  try {
    console.log('Testing energy endpoint...');
    const result = await pool.query('SELECT ROUND(SUM(consumption), 2) as total FROM energy_data WHERE DATE(timestamp) = CURRENT_DATE');
    console.log('Query successful, today total:', result.rows[0].total);
    res.json({
      success: true,
      today_total: result.rows[0].total
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(3002, () => {
  console.log('Test API server running on port 3002');
});
