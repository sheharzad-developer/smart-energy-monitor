const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create devices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        location VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        last_reading TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create telemetry_data table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS telemetry_data (
        id SERIAL PRIMARY KEY,
        device_id INTEGER REFERENCES devices(id),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        energy_consumed DECIMAL(10,2),
        power_usage DECIMAL(10,2),
        voltage DECIMAL(10,2),
        current DECIMAL(10,2),
        temperature DECIMAL(5,2),
        humidity DECIMAL(5,2)
      )
    `);

    // Insert sample data
    await pool.query(`
      INSERT INTO devices (name, type, location, status) VALUES
      ('Living Room Smart Plug', 'smart_plug', 'Living Room', 'active'),
      ('Kitchen Appliances', 'smart_meter', 'Kitchen', 'active'),
      ('Bedroom AC Unit', 'smart_switch', 'Bedroom', 'active')
      ON CONFLICT DO NOTHING
    `);

    await pool.query(`
      INSERT INTO telemetry_data (device_id, energy_consumed, power_usage, voltage, current, temperature, humidity) VALUES
      (1, 2.5, 150.0, 240.0, 0.625, 22.5, 45.0),
      (2, 5.2, 300.0, 238.0, 1.26, 25.0, 40.0),
      (3, 3.8, 220.0, 242.0, 0.91, 21.0, 50.0)
      ON CONFLICT DO NOTHING
    `);

    res.status(200).json({
      success: true,
      message: 'Database initialized successfully',
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initialize database',
      error: error.message 
    });
  }
} 