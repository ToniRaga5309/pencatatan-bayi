const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.tlprjtgvkwcnduiamcbe:5309023101020003@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    const newHash = await bcrypt.hash('AdminNgaba2024!', 10);
    console.log('New hash generated');

    const res = await pool.query('UPDATE users SET password = $1 WHERE username = $2 RETURNING id, username', [newHash, 'admin_dukcapil']);
    console.log('Updated:', res.rows[0]);

    // Verify
    const check = await pool.query('SELECT password FROM users WHERE username = $1', ['admin_dukcapil']);
    const match = await bcrypt.compare('AdminNgaba2024!', check.rows[0].password);
    console.log('Password verified:', match);
  } catch(err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();
