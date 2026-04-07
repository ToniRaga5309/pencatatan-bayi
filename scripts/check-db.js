const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.tlprjtgvkwcnduiamcbe:5309023101020003@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    console.log('Connecting to database...');
    await pool.query('SELECT 1');
    console.log('Connected!');

    // Drop the invalid FK constraint
    await pool.query('ALTER TABLE IF EXISTS "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_entity_id_fkey"');
    console.log('Dropped audit_logs_entity_id_fkey constraint');

    // Check users table
    const users = await pool.query('SELECT id, username, role, puskesmas_id FROM users ORDER BY created_at DESC');
    console.log('Users found:', users.rows.length);
    users.rows.forEach(u => console.log('  -', u.username, '|', u.role, '| puskesmas:', u.puskesmas_id));

    // Check puskesmas table
    const puskesmas = await pool.query('SELECT id, nama, kode_wilayah FROM puskesmas ORDER BY nama');
    console.log('Puskesmas found:', puskesmas.rows.length);
    puskesmas.rows.forEach(p => console.log('  -', p.nama, '| kode:', p.kode_wilayah));

    // Check birth_records count
    const records = await pool.query('SELECT COUNT(*) as total, status FROM birth_records GROUP BY status');
    console.log('Birth records by status:');
    records.rows.forEach(r => console.log('  -', r.status + ':', r.total));

  } catch(err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();
