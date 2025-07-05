const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { device_id, limit = 100, offset = 0 } = req.query;

  try {
    let query = `
      SELECT 
        id,
        device_id,
        timestamp,
        energy_consumed,
        power_usage,
        voltage,
        current,
        temperature,
        humidity
      FROM telemetry_data
    `;
    
    const params = [];
    
    if (device_id) {
      query += ` WHERE device_id = $1`;
      params.push(device_id);
    }
    
    query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Telemetry data retrieval error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve telemetry data' 
    });
  }
} 