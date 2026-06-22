require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

pool.query('SELECT name, images FROM products ORDER BY created_at DESC').then(r => {
  r.rows.forEach(row => {
    const imgs = row.images;
    const allCloudinary = Array.isArray(imgs) && imgs.every(i => i && (i.startsWith('https://res.cloudinary.com') || i.startsWith('https://images.unsplash')));
    const hasBase64 = Array.isArray(imgs) && imgs.some(i => i && i.startsWith('data:'));
    const status = hasBase64 ? '❌ HAS BASE64' : '✅ CLEAN';
    console.log(status, '-', row.name.padEnd(35), '|', imgs?.length || 0, 'images | First:', (imgs?.[0] || '').substring(0, 50));
  });
  pool.end();
}).catch(e => { console.error(e.message); pool.end(); });
