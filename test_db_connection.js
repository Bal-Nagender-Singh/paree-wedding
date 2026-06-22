require('dotenv').config({ path: 'd:/paree/.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.connect()
  .then(client => {
    console.log('✅ DB connection successful');
    client.release();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ DB connection failed', err);
    process.exit(1);
  });
