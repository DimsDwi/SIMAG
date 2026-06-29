const pool = require('../backend/db');

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SHOW DATABASES;');
    console.log('Databases:', rows.map(r => Object.values(r)[0]));
    connection.release();
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
}

testConnection();
