const baseUrl = 'http://localhost:3000';

async function test() {
  console.log('--- TEST 1: Register ---');
  let res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', identifier: 'test_user', password: 'password123', role: 'mahasiswa' })
  });
  let data = await res.json();
  console.log('Register Response:', data);

  const token = data.token;

  console.log('\n--- TEST 2: Login ---');
  res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'test_user', password: 'password123' })
  });
  data = await res.json();
  console.log('Login Response:', data);

  console.log('\n--- TEST 3: Access Protected Route Without Token ---');
  res = await fetch(`${baseUrl}/api/people/student`);
  console.log('Status Code:', res.status);
  console.log('Response:', await res.json().catch(e => e.message));

  console.log('\n--- TEST 4: Access Protected Route With Valid Token ---');
  res = await fetch(`${baseUrl}/api/people/student`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Status Code:', res.status);
  console.log('Response:', await res.json().catch(e => e.message));
  
  console.log('\n--- TEST 5: Verify Hash in DB ---');
  const pool = require('./backend/db');
  const [users] = await pool.query('SELECT password FROM users WHERE identifier = "test_user"');
  console.log('Password hash in DB:', users[0]?.password);
  
  process.exit();
}

test();
