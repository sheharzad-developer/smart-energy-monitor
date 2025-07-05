const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { query } = req.body;

  try {
    // Simple AI-like responses based on query patterns
    let response = '';
    
    if (query.toLowerCase().includes('energy') || query.toLowerCase().includes('consumption')) {
      // Get energy consumption data
      const result = await pool.query(`
        SELECT 
          AVG(energy_consumed) as avg_energy,
          MAX(energy_consumed) as max_energy,
          MIN(energy_consumed) as min_energy,
          COUNT(*) as total_readings
        FROM telemetry_data 
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
      `);
      
      const data = result.rows[0];
      response = `Based on the last 24 hours: Average energy consumption is ${data.avg_energy?.toFixed(2)} kWh, with a maximum of ${data.max_energy?.toFixed(2)} kWh and minimum of ${data.min_energy?.toFixed(2)} kWh. Total readings: ${data.total_readings}`;
    } 
    else if (query.toLowerCase().includes('device') || query.toLowerCase().includes('status')) {
      // Get device status
      const result = await pool.query(`
        SELECT status, COUNT(*) as count 
        FROM devices 
        GROUP BY status
      `);
      
      const statusSummary = result.rows.map(row => `${row.count} ${row.status}`).join(', ');
      response = `Device status summary: ${statusSummary}`;
    }
    else if (query.toLowerCase().includes('temperature')) {
      // Get temperature data
      const result = await pool.query(`
        SELECT 
          AVG(temperature) as avg_temp,
          MAX(temperature) as max_temp,
          MIN(temperature) as min_temp
        FROM telemetry_data 
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        AND temperature IS NOT NULL
      `);
      
      const data = result.rows[0];
      response = `Temperature in the last 24 hours: Average ${data.avg_temp?.toFixed(1)}°C, Max ${data.max_temp?.toFixed(1)}°C, Min ${data.min_temp?.toFixed(1)}°C`;
    }
    else {
      response = 'I can help you with energy consumption, device status, and temperature queries. Try asking about energy usage, device status, or temperature readings.';
    }

    res.status(200).json({
      success: true,
      query,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process query' 
    });
  }
} 