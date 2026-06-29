const pool = require('../backend/db');

async function run() {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE identifier = "24.99.9999"');
    console.table(rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
