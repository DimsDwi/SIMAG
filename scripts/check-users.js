// Script to check user credentials in DB - run from project root
// node scripts/check-users.js
const mysql = require('mysql2/promise');
require('dotenv').config();
async function check() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'simag_db'
  });
  const [users] = await pool.query('SELECT id, role, identifier, SUBSTRING(password,1,4) as pw_prefix FROM users LIMIT 20');
  console.log('=== USERS IN DATABASE ===');
  users.forEach(u => {
    const isBcrypt = u.pw_prefix && u.pw_prefix.startsWith('$2');
    console.log(u.role.padEnd(15), u.identifier.padEnd(35), isBcrypt ? '[BCRYPT]' : '[PLAINTEXT - pw_prefix:' + u.pw_prefix + ']');
  });
  await pool.end();
}
check().catch(e => console.error('DB Error:', e.message));
