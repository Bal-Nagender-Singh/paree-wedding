const fs = require('fs');
const { Pool } = require('pg');
// Simple .env parser for DATABASE_URL
const envContent = fs.readFileSync('d:/paree/.env', { encoding: 'utf8' });
const dbUrlMatch = envContent.match(/DATABASE_URL\s*=\s*(.+)/);
if (!dbUrlMatch) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}
const connectionString = dbUrlMatch[1].trim();
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
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
