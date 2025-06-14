const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'gestmed-postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'gestmed',
  user: process.env.DB_USER || 'gestmed_user',
  password: process.env.DB_PASSWORD || 'gestmed_password',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

module.exports = pool;
