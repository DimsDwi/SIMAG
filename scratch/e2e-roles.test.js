const { chromium } = require('playwright');
const assert = require('assert');
const pool = require('../backend/db');

async function testRole(page, role, identifier, name, password, identifierPlaceholder) {
  console.log(`\n--- Testing Role: ${role} ---`);
  
  try {
    await page.evaluate(() => localStorage.clear());
  } catch(e) {
    // If it's about:blank, navigate to a safe page first
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => localStorage.clear());
  }
  
  // Registration
  console.log(`Navigating to register page...`);
  await page.goto('http://localhost:5173/register.html', { waitUntil: 'load' });
  
  // Click the role tab
  const roleLabel = role === 'adminprodi' ? 'Admin Prodi' : role === 'mitra' ? 'Mitra' : role === 'dospem' ? 'Dospem' : 'Mahasiswa';
  const tabSelector = `button.role-tab:has-text("${roleLabel}")`;
  await page.waitForSelector(tabSelector, { state: 'visible' });
  await page.click(tabSelector);
  await page.waitForTimeout(1000); // Wait to show user
  
  // Fill the form
  await page.waitForSelector('input.field-input', { state: 'visible' });
  const inputs = page.locator('input.field-input');
  await inputs.nth(0).fill(name);
  await page.waitForTimeout(500);
  
  await inputs.nth(1).fill(identifier);
  await page.waitForTimeout(500);
  
  await inputs.nth(2).fill(password);
  await page.waitForTimeout(500);
  
  await inputs.nth(3).fill(password);
  await page.waitForTimeout(1000);
  
  console.log('Submitting register form...');
  await page.click('button[type="submit"]');
  
  // Wait for success message and redirect
  await page.waitForTimeout(3000);
  const currentUrl = page.url();
  
  if (currentUrl.includes('login.html')) {
    console.log(`✓ Successfully redirected to login page for ${role}.`);
  } else {
    const text = await page.innerText('body');
    if (text.includes('Akun sudah terdaftar')) {
       console.log('User already exists, proceeding to login...');
    } else {
       throw new Error(`Registration failed for ${role}. Output: ${text.substring(0, 200)}`);
    }
  }

  // Verify in MySQL
  const [users] = await pool.query('SELECT * FROM users WHERE identifier = ? AND role = ?', [identifier, role]);
  assert.strictEqual(users.length, 1, 'User should exist in database');
  console.log(`✓ User verified in database for ${role}.`);

  // Login
  console.log(`Navigating to login page...`);
  await page.goto('http://localhost:5173/login.html', { waitUntil: 'load' });
  
  // Select Role in login (login page also has role tabs)
  const loginTabSelector = `button.role-tab:has-text("${role === 'adminprodi' ? 'Admin Prodi' : role === 'mitra' ? 'Mitra' : role === 'dospem' ? 'Dospem' : 'Mahasiswa'}")`;
  if (await page.$(loginTabSelector)) {
     await page.click(loginTabSelector);
     await page.waitForTimeout(1000);
  }

  // Fill login
  await page.waitForSelector('input.field-input', { state: 'visible' });
  const loginInputs = page.locator('input.field-input');
  await loginInputs.nth(0).fill(identifier);
  await page.waitForTimeout(500);
  await loginInputs.nth(1).fill(password);
  await page.waitForTimeout(1000);
  
  console.log('Submitting login form...');
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForTimeout(3000);
  const newUrl = page.url();
  
  const expectedDashboards = {
    mahasiswa: 'dashboard-mahasiswa.html',
    adminprodi: 'dashboard-admin.html',
    mitra: 'dashboard-mitra.html',
    dospem: 'dashboard-dospem.html'
  };
  
  if (newUrl.includes(expectedDashboards[role])) {
    console.log(`✓ Login succeeded for ${role}. Redirected to ${expectedDashboards[role]}.`);
  } else {
    throw new Error(`Login failed for ${role}. Current URL: ${newUrl}`);
  }
}

async function run() {
  console.log('Launching browser (headed)...');
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();
  
  try {
    // 1. Mahasiswa
    await testRole(
      page, 
      'mahasiswa', 
      '24.11.1111', 
      'Live Mahasiswa', 
      'password123',
      'Masukkan NIM Anda (Format: 23.11.5508)'
    );

    // 2. Mitra
    await testRole(
      page, 
      'mitra', 
      'hr@livemitra.com', 
      'PT Live Mitra', 
      'password123',
      'Masukkan email resmi perusahaan'
    );
    
    // 3. Admin Prodi
    await testRole(
      page, 
      'adminprodi', 
      'admin_live', 
      'Admin Live', 
      'password123',
      'Buat username admin prodi'
    );
    
    // 4. Dospem
    await testRole(
      page, 
      'dospem', 
      '999888777', 
      'Dosen Pembimbing Live', 
      'password123',
      'Masukkan NIP atau NIDN Dosen'
    );
    
    console.log('\n=====================================');
    console.log('✓ SEMUA ROLE BERHASIL DI TEST');
    console.log('=====================================');
    
  } catch (error) {
    console.error('\n✗ TEST GAGAL:', error.message);
  } finally {
    console.log('Menutup browser dalam 5 detik...');
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
    process.exit(0);
  }
}

run();
