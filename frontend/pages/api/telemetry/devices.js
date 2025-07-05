const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        type,
        location,
        status,
        last_reading,
        created_at
      FROM devices 
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      devices: result.rows,
    });
  } catch (error) {
    console.error('Devices retrieval error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve devices' 
    });
  }
} 