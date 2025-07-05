const express = require("express");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// POST /api/telemetry - Store telemetry data
app.post('/api/telemetry', async (req, res) => {
  try {
    const { deviceId, timestamp, energyWatts } = req.body;

    if (!deviceId || !timestamp || energyWatts === undefined) {
      return res.status(400).json({ 
        error: 'deviceId, timestamp, and energyWatts are required' 
      });
    }

    // Verify device exists
    const device = await pool.query(
      'SELECT * FROM devices WHERE id = $1',
      [deviceId]
    );

    if (device.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Insert telemetry data
    const result = await pool.query(
      'INSERT INTO telemetry_data (device_id, timestamp, energy_consumed, power_usage) VALUES ($1, $2, $3, $3) RETURNING *',
      [deviceId, timestamp, energyWatts]
    );

    res.status(201).json({
      message: 'Telemetry data stored successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Telemetry storage error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/telemetry - Retrieve telemetry data with filters
app.get('/api/telemetry', async (req, res) => {
  try {
    const { deviceId, startDate, endDate, limit = 100 } = req.query;

    let query = `
      SELECT t.*, d.name as device_name 
      FROM telemetry_data t 
      JOIN devices d ON t.device_id = d.id 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (deviceId) {
      paramCount++;
      query += ` AND t.device_id = $${paramCount}`;
      params.push(deviceId);
    }

    if (startDate) {
      paramCount++;
      query += ` AND t.timestamp >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND t.timestamp <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY t.timestamp DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('Telemetry retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/devices - Get all devices
app.get('/api/devices', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM devices ORDER BY name'
    );

    res.json({
      count: result.rows.length,
      devices: result.rows
    });

  } catch (error) {
    console.error('Devices retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/devices/:deviceId/stats - Get device statistics
app.get('/api/devices/:deviceId/stats', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { days = 7 } = req.query;

    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_readings,
        AVG(energy_consumed) as avg_watts,
        MIN(energy_consumed) as min_watts,
        MAX(energy_consumed) as max_watts,
        SUM(energy_consumed) as total_watts,
        DATE_TRUNC('day', timestamp) as day,
        SUM(energy_consumed) as daily_watts
      FROM telemetry_data 
      WHERE device_id = $1 
        AND timestamp >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE_TRUNC('day', timestamp)
      ORDER BY day DESC
    `, [deviceId]);

    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total_readings,
        AVG(energy_consumed) as avg_watts,
        MIN(energy_consumed) as min_watts,
        MAX(energy_consumed) as max_watts,
        SUM(energy_consumed) as total_watts
      FROM telemetry_data 
      WHERE device_id = $1 
        AND timestamp >= NOW() - INTERVAL '${days} days'
    `, [deviceId]);

    res.json({
      deviceId,
      days: parseInt(days),
      summary: summary.rows[0],
      dailyStats: stats.rows
    });

  } catch (error) {
    console.error('Device stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/", (req, res) => res.send("Telemetry service running"));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Telemetry service running on port ${PORT}`)); 