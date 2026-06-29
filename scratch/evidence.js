const pool = require('../backend/db');
const fs = require('fs');
const path = require('path');

async function checkDatabase() {
  const connection = await pool.getConnection();
  
  console.log('--- SHOW CREATE TABLE users ---');
  const [createTableRows] = await connection.query('SHOW CREATE TABLE users');
  console.log(createTableRows[0]['Create Table']);
  
  console.log('\n--- SHOW INDEX FROM users ---');
  const [indexRows] = await connection.query('SHOW INDEX FROM users');
  console.table(indexRows.map(r => ({ Table: r.Table, Key_name: r.Key_name, Column_name: r.Column_name, Non_unique: r.Non_unique })));

  connection.release();
}

async function checkApi() {
  const testUser = {
    fullname: 'Evidence User',
    identifier: '99.99.9999',
    password: 'password123',
    role: 'mahasiswa'
  };

  // 1. Valid Register
  console.log('\n--- API: Valid Register ---');
  let res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  console.log(`Status Code: ${res.status}`);
  let data = await res.json();
  console.log(`Response: ${JSON.stringify(data)}`);

  // 2. Duplicate Register
  console.log('\n--- API: Duplicate Register ---');
  res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  console.log(`Status Code: ${res.status}`);
  data = await res.json();
  console.log(`Response: ${JSON.stringify(data)}`);

  // 3. Invalid Validation (Short password)
  console.log('\n--- API: Validation Error ---');
  res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...testUser, identifier: '88.88.8888', password: '123' })
  });
  console.log(`Status Code: ${res.status}`);
  data = await res.json();
  console.log(`Response: ${JSON.stringify(data)}`);

  // 4. Valid Login
  console.log('\n--- API: Valid Login ---');
  res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '99.99.9999', password: 'password123' })
  });
  console.log(`Status Code: ${res.status}`);
  data = await res.json();
  console.log(`Response: ${JSON.stringify(data)}`);
}

async function run() {
  try {
    // cleanup first
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM users WHERE identifier = "99.99.9999"');
    connection.release();

    await checkDatabase();
    await checkApi();
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
