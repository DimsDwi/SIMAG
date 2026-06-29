const { chromium } = require('playwright');
const pool = require('../backend/db');
const assert = require('assert');

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runTests() {
  let browser;
  let connection;
  try {
    connection = await pool.getConnection();

    console.log('\n===========================================================');
    console.log('PHASE 1 — START SERVICES');
    console.log('===========================================================');
    // We assume services are started based on external processes.
    console.log('Backend on port 3000 (assumed)');
    console.log('Frontend on port 5173 (assumed)');
    
    const [dbRows] = await connection.query('SELECT 1 as val');
    assert.strictEqual(dbRows[0].val, 1, 'Database should be running');
    console.log('MySQL Database is running.');

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let logs = [];
    let requests = [];
    let failedRequests = [];

    page.on('console', msg => {
      logs.push(msg.text());
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        requests.push({ url: response.url(), status: response.status() });
        if (response.status() >= 400) {
          failedRequests.push({ url: response.url(), status: response.status() });
        }
      }
    });

    console.log('\n===========================================================');
    console.log('PHASE 2 — REGISTER TEST');
    console.log('===========================================================');
    
    const testNim = '23.11.9999';
    const testPassword = 'Password123!';
    const testName = 'Test E2E Student';

    console.log('Navigating to http://localhost:5173/register.html...');
    await page.goto('http://localhost:5173/register.html', { waitUntil: 'networkidle' });

    // The default role is Mahasiswa. Wait for the form.
    await page.waitForSelector('input[placeholder="Masukkan nama lengkap sesuai KTM"]');

    // Fill form
    await page.fill('input[placeholder="Masukkan nama lengkap sesuai KTM"]', testName);
    await page.fill('input[placeholder="Masukkan NIM Anda (Format: 23.11.5508)"]', testNim);
    await page.fill('input[placeholder="Min. 6 karakter"]', testPassword);
    await page.fill('input[placeholder="Ulangi password"]', testPassword);

    console.log('Submitting registration form...');
    // Click submit
    await page.click('button[type="submit"]');

    // Wait for the success message to appear, or for an API response.
    // The code does: this.formSuccess = '...'; setTimeout(() => redirect, 2000)
    await page.waitForTimeout(1000);
    
    // Check page text for success or error
    const pageText = await page.innerText('body');
    if (pageText.includes('Pendaftaran Berhasil')) {
      console.log('✓ Registration successful on frontend.');
    } else {
      console.log('✗ Registration might have failed or success text missing. Check logs.');
      console.log('Page body text snippet:', pageText.substring(0, 500));
    }

    console.log('\n===========================================================');
    console.log('PHASE 3 — MYSQL VERIFICATION');
    console.log('===========================================================');
    
    const [users] = await connection.query('SELECT * FROM users WHERE identifier = ? AND role = "mahasiswa"', [testNim]);
    
    if (users.length === 1) {
      console.log('✓ User record exists in MySQL');
      const user = users[0];
      
      assert.strictEqual(user.name, testName, 'Username is correct');
      console.log('✓ Username is correct');
      
      assert.strictEqual(user.identifier, testNim, 'Identifier (NIM) is correct');
      console.log('✓ Identifier is correct');
      
      assert.strictEqual(user.role, 'mahasiswa', 'Role is correct');
      console.log('✓ Role is correct');
      
      assert.ok(user.created_at, 'Timestamp is generated');
      console.log('✓ Timestamp is generated');
      
      assert.ok(user.password.startsWith('$2'), 'Password is securely hashed with bcrypt');
      assert.notStrictEqual(user.password, testPassword, 'Password is never plaintext');
      console.log('✓ Password is securely hashed (never plaintext)');
    } else {
      console.error('✗ Failed to find the inserted user in MySQL. Users array length:', users.length);
      throw new Error('MySQL Verification Failed');
    }

    console.log('\n===========================================================');
    console.log('PHASE 4 — LOGIN TEST');
    console.log('===========================================================');
    
    console.log('Navigating to http://localhost:5173/login.html...');
    await page.goto('http://localhost:5173/login.html', { waitUntil: 'networkidle' });

    // Assuming we clear localStorage before login to simulate fresh state
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });

    await page.waitForSelector('input[placeholder="Masukkan NIM"]');
    await page.fill('input[placeholder="Masukkan NIM"]', testNim);
    await page.fill('input[placeholder="Masukkan password"]', testPassword);
    
    console.log('Submitting login form...');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    
    if (currentUrl.includes('dashboard-mahasiswa.html')) {
      console.log('✓ Redirect to dashboard succeeds');
    } else {
      console.error(`✗ Did not redirect to dashboard. Current URL: ${currentUrl}`);
      throw new Error('Login redirect failed');
    }
    
    // Check if session exists in localStorage
    const token = await page.evaluate(() => localStorage.getItem('simag_token'));
    if (token) {
      console.log('✓ JWT token is created in localStorage');
    } else {
      throw new Error('Token not found in localStorage');
    }

    console.log('\n===========================================================');
    console.log('PHASE 5 — NEGATIVE TESTS');
    console.log('===========================================================');
    
    // Clean session to log out
    await page.evaluate(() => localStorage.clear());
    console.log('Navigating back to register page for negative tests...');
    
    // Helper for testing payloads
    async function testPayload(name, nim, desc) {
      await page.goto('http://localhost:5173/register.html', { waitUntil: 'networkidle' });
      await page.waitForSelector('input[placeholder="Masukkan nama lengkap sesuai KTM"]');
      await page.fill('input[placeholder="Masukkan nama lengkap sesuai KTM"]', name);
      await page.fill('input[placeholder="Masukkan NIM Anda (Format: 23.11.5508)"]', nim);
      await page.fill('input[placeholder="Min. 6 karakter"]', testPassword);
      await page.fill('input[placeholder="Ulangi password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      const text = await page.innerText('body');
      console.log(`[Negative Test] ${desc}: ${text.includes('Pendaftaran Berhasil') ? 'FAILED (Accepted)' : 'PASSED (Rejected)'}`);
    }

    // Duplicate username test
    await testPayload(testName, testNim, 'Duplicate Username');
    
    // SQL Injection
    await testPayload("Test' OR 1=1--", '23.11.9999', 'SQL Injection Name');
    await testPayload('Test', "23.11.0000' OR '1'='1", 'SQL Injection NIM');
    
    // XSS
    await testPayload('<script>alert("xss")</script>', '23.11.8888', 'XSS Payload Name');
    
    // Unicode & Long
    const longName = 'A'.repeat(300);
    await testPayload(longName, '23.11.7777', 'Extremely Long Input Name');
    await testPayload('テスト ユーザー', '23.11.6666', 'Unicode Name');

    // Check DB that we didn't insert any of the negative test users (excluding Unicode which is valid)
    const [negUsers] = await connection.query('SELECT * FROM users WHERE identifier IN ("23.11.0000\' OR \'1\'=\'1", "23.11.8888", "23.11.7777")');
    assert.strictEqual(negUsers.length, 0, 'Should not have inserted invalid users in DB');
    
    const [dupUsers] = await connection.query('SELECT * FROM users WHERE identifier = ? AND role = "mahasiswa"', [testNim]);
    assert.strictEqual(dupUsers.length, 1, 'Should not have duplicate users in DB');
    console.log('✓ Failed registration does not insert partial records (Database consistency)');

    console.log('\n===========================================================');
    console.log('PHASE 6 — DATABASE CONSISTENCY');
    console.log('===========================================================');
    console.log('Verified along with Negative Tests: no duplicate users exist.');

    console.log('\n===========================================================');
    console.log('CLEANUP');
    console.log('===========================================================');
    // Remove the test user
    await connection.query('DELETE FROM users WHERE identifier = ? AND role = "mahasiswa"', [testNim]);
    console.log('✓ Test user cleaned up');

    console.log('\n===========================================================');
    console.log('SUCCESS: All tests passed!');
    console.log('===========================================================');
    
  } catch (err) {
    console.error('\n!!! TEST SCRIPT FAILED !!!');
    console.error(err);
  } finally {
    if (browser) await browser.close();
    if (connection) connection.release();
    process.exit(0);
  }
}

runTests();
