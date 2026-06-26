const baseUrl = 'http://localhost:3000';

async function fetchSummary() {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'test_user', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  console.log('--- ADMIN SUMMARY ---');
  let res = await fetch(`${baseUrl}/api/dashboard/summary-admin`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(await res.json());

  console.log('--- DOSPEM SUMMARY ---');
  res = await fetch(`${baseUrl}/api/dashboard/summary-dospem`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(await res.json());
}

fetchSummary();
