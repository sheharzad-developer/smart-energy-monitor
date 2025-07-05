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

// GET /api/devices - Get all devices
app.get('/api/devices', async (req, res) => {
  try {
    console.log('Getting devices...');
    const result = await pool.query('SELECT d.*, u.username FROM devices d LEFT JOIN users u ON d.user_id = u.id ORDER BY d.name');
    console.log('Found', result.rows.length, 'devices');
    res.json({
      count: result.rows.length,
      devices: result.rows
    });
  } catch (error) {
    console.error('Devices error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/telemetry - Get energy data
app.get('/api/telemetry', async (req, res) => {
  try {
    const { deviceId, startDate, endDate, limit = 100 } = req.query;
    
    let query = `
      SELECT e.*, d.name as device_name 
      FROM energy_data e 
      JOIN devices d ON e.device_id = d.id 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (deviceId) {
      paramCount++;
      query += ` AND e.device_id = $${paramCount}`;
      params.push(deviceId);
    }

    if (startDate) {
      paramCount++;
      query += ` AND e.timestamp >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND e.timestamp <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY e.timestamp DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    console.log('Found', result.rows.length, 'energy readings');

    res.json({
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Telemetry error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/energy/today - Get today's energy consumption
app.get('/api/energy/today', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ROUND(SUM(consumption), 2) as total_consumption,
        COUNT(DISTINCT device_id) as active_devices,
        ROUND(AVG(consumption), 2) as avg_per_device
      FROM energy_data 
      WHERE DATE(timestamp) = CURRENT_DATE
    `);

    res.json({
      today: result.rows[0]
    });
  } catch (error) {
    console.error('Today energy error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => res.send('Telemetry service running'));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Telemetry service running on port ${PORT}`));
