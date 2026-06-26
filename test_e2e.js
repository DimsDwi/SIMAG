const baseUrl = 'http://localhost:3001';

const testUser = {
  name: 'Test E2E User',
  identifier: `e2e_user_${Date.now()}`,
  password: 'securepassword123',
  role: 'mahasiswa'
};

let authToken = '';

async function runTest(name, expectedStatus, promise) {
  process.stdout.write(`⏳ Running: ${name}... `);
  try {
    const res = await promise;
    const body = await res.json();
    if (res.status === expectedStatus) {
      console.log(`✅ Passed [${res.status}]`);
      return body;
    } else {
      console.log(`❌ Failed. Expected ${expectedStatus}, got ${res.status}`);
      console.log(`Response:`, body);
      process.exit(1);
    }
  } catch (err) {
    console.log(`❌ Failed with exception: ${err.message}`);
    process.exit(1);
  }
}

async function runE2E() {
  console.log('--- STARTING E2E AUTHENTICATION TESTS ---\n');

  // Test 1: Registrasi user baru (Harus menghasilkan HTTP 200)
  await runTest(
    'Test 1: Registrasi user baru',
    200,
    fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    })
  );

  // Test 2: Registrasi ulang dengan user yang sama (Harus menghasilkan HTTP 400)
  await runTest(
    'Test 2: Registrasi ulang (duplicate entry)',
    400,
    fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    })
  );

  // Test 3: Login dengan user tersebut (Harus menghasilkan HTTP 200)
  const loginData = await runTest(
    'Test 3: Login dengan kredensial',
    200,
    fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testUser.identifier, password: testUser.password, role: testUser.role })
    })
  );
  authToken = loginData.token;

  if (!authToken) {
    console.log('❌ Failed: Token JWT tidak ditemukan dalam response login.');
    process.exit(1);
  }

  // Test 4: Akses endpoint terproteksi menggunakan JWT yang didapat (Harus menghasilkan HTTP 200)
  await runTest(
    'Test 4: Akses endpoint terproteksi dengan JWT',
    200,
    fetch(`${baseUrl}/api/interns`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
  );

  console.log('\n✅ ALL TESTS PASSED');
  process.exit(0);
}

runE2E();
