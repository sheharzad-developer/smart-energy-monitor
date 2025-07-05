const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres@localhost:5432/smart-energy-monitor",
  // Fallback configuration
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smart-energy-monitor',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

module.exports = pool;
