const pool = require('../backend/db');

async function fixDb() {
  try {
    const connection = await pool.getConnection();
    
    // Clean up live test users
    console.log('Cleaning up live test users...');
    await connection.query('DELETE FROM users WHERE identifier IN ("24.11.1111", "hr@livemitra.com", "admin_live", "999888777")');
    
    connection.release();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixDb();
