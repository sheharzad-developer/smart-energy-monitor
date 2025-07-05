const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://neondb_owner:npg_Z8qNmorUA7BD@ep-cool-shape-aerjn62p-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
});

async function initializeDatabase() {
  console.log('🗄️  Initializing database...');
  
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

    console.log('✅ Database tables created successfully');

    // Insert sample data
    const deviceCheckResult = await pool.query('SELECT COUNT(*) FROM devices');
    if (parseInt(deviceCheckResult.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO devices (name, type, location, status) VALUES
        ('Living Room Smart Plug', 'smart_plug', 'Living Room', 'active'),
        ('Kitchen Appliances', 'smart_meter', 'Kitchen', 'active'),
        ('Bedroom AC Unit', 'smart_switch', 'Bedroom', 'active')
      `);

      await pool.query(`
        INSERT INTO telemetry_data (device_id, energy_consumed, power_usage, voltage, current, temperature, humidity) VALUES
        (1, 2.5, 150.0, 240.0, 0.625, 22.5, 45.0),
        (2, 5.2, 300.0, 238.0, 1.26, 25.0, 40.0),
        (3, 3.8, 220.0, 242.0, 0.91, 21.0, 50.0)
      `);

      console.log('✅ Sample data inserted successfully');
    } else {
      console.log('ℹ️  Sample data already exists, skipping insertion');
    }

    console.log('🚀 Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeDatabase(); 