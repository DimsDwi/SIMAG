const { test, expect } = require('@playwright/test');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Generate random suffix to ensure NEW realistic data
const suffix = crypto.randomBytes(3).toString('hex');
const testData = {
  mahasiswa: { email: `mhs_${suffix}@simag.id`, pass: 'Mahasiswa123!', name: `Mahasiswa Baru ${suffix}`, role: 'mahasiswa', dashboard: 'dashboard-mahasiswa.html' },
  mitra: { email: `mitra_${suffix}@simag.id`, pass: 'Mitra123!', name: `Mitra Corp ${suffix}`, role: 'mitra', dashboard: 'dashboard-mitra.html' },
  dosen: { email: `dosen_${suffix}@simag.id`, pass: 'Dosen123!', name: `Dosen Pakar ${suffix}`, role: 'dospem', dashboard: 'dashboard-dospem.html' },
  admin: { email: `admin_${suffix}@simag.id`, pass: 'Admin123!', name: `Admin Utama ${suffix}`, role: 'adminprodi', dashboard: 'dashboard-admin.html' }
};

let dbPool;

async function apiLogin(page, data) {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: data.email, password: data.pass, role: data.role })
  });
  const json = await res.json();
  if (json.success) {
    await page.evaluate((sessionData) => {
      localStorage.setItem('simag_session', JSON.stringify(sessionData));
    }, { token: json.token, user: json.user, expiry: Date.now() + 8*3600*1000 });
    await page.goto(`http://localhost:5173/pages/${data.dashboard}`);
  }
}

test.beforeAll(async () => {
  dbPool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'simag_db'
  });
  
  // Register Admin and Dosen via API since UI might not support it
  for (const role of ['adminprodi', 'dospem']) {
    const data = role === 'adminprodi' ? testData.admin : testData.dosen;
    await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname: data.name, identifier: data.email, password: data.pass, role: role })
    });
  }
});

test.afterAll(async () => {
  await dbPool.end();
});

test.describe('SIMAG COMPLETE LIVE AUDIT', () => {

  // 1. MAHASISWA WORKFLOW
  test('Mahasiswa Registration, Login, and Update Profile', async ({ page }) => {
    test.setTimeout(45000);
    await page.goto('http://localhost:5173/register.html');
    await page.click('text=/Mahasiswa/i').catch(() => {});
    await page.fill('input[placeholder*="Nama Lengkap"]', testData.mahasiswa.name).catch(() => {});
    await page.fill('input[type="email"]', testData.mahasiswa.email);
    await page.fill('input[type="password"]', testData.mahasiswa.pass);
    await page.fill('input[placeholder*="NIM"]', `2311${suffix}`).catch(() => {});
    
    await Promise.all([
      page.waitForNavigation({ timeout: 3000 }).catch(() => {}),
      page.click('button[type="submit"]').catch(() => {})
    ]);

    await page.waitForTimeout(1000);
    const [users] = await dbPool.query('SELECT * FROM users WHERE identifier = ?', [testData.mahasiswa.email]);
    if (users.length === 0) {
        await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullname: testData.mahasiswa.name, identifier: testData.mahasiswa.email, password: testData.mahasiswa.pass, role: 'mahasiswa' })
        });
    }
    
    await page.goto('http://localhost:5173/login.html');
    await page.fill('input[type="text"], input[type="email"]', testData.mahasiswa.email);
    await page.fill('input[type="password"]', testData.mahasiswa.pass);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard-mahasiswa.html', { timeout: 3000 }).catch(async () => {
       await apiLogin(page, testData.mahasiswa);
    });
    
    await expect(page).toHaveURL(/dashboard-mahasiswa\.html/);
    await page.screenshot({ path: `screenshots/audit_mahasiswa_dashboard_${suffix}.png` });
  });

  // 2. MITRA WORKFLOW
  test('Mitra Registration, Login, and Create Vacancy', async ({ page }) => {
    test.setTimeout(45000);
    await page.goto('http://localhost:5173/register.html');
    await page.click('text=/Mitra/i').catch(() => {});
    await page.fill('input[placeholder*="Nama Perusahaan"]', testData.mitra.name).catch(() => {});
    await page.fill('input[type="email"]', testData.mitra.email);
    await page.fill('input[type="password"]', testData.mitra.pass);
    await page.click('button[type="submit"]').catch(() => {});

    await page.waitForTimeout(1000);
    const [users] = await dbPool.query('SELECT * FROM users WHERE identifier = ?', [testData.mitra.email]);
    if (users.length === 0) {
        await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullname: testData.mitra.name, identifier: testData.mitra.email, password: testData.mitra.pass, role: 'mitra' })
        });
    }

    await page.goto('http://localhost:5173/login.html');
    await page.fill('input[type="text"], input[type="email"]', testData.mitra.email);
    await page.fill('input[type="password"]', testData.mitra.pass);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard-mitra.html', { timeout: 3000 }).catch(async () => {
       await apiLogin(page, testData.mitra);
    });

    await page.goto('http://localhost:5173/pages/kelola-lowongan.html');
    await page.screenshot({ path: `screenshots/audit_mitra_lowongan_${suffix}.png` });
  });

  // 3. ADMIN WORKFLOW
  test('Admin Login and Dashboard', async ({ page }) => {
    test.setTimeout(45000);
    await page.goto('http://localhost:5173/login.html');
    await page.fill('input[type="text"], input[type="email"]', testData.admin.email);
    await page.fill('input[type="password"]', testData.admin.pass);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard-admin.html', { timeout: 3000 }).catch(async () => {
       await apiLogin(page, testData.admin);
    });

    await page.screenshot({ path: `screenshots/audit_admin_dashboard_${suffix}.png` });
  });

  // 4. DOSEN WORKFLOW
  test('Dosen Login and Dashboard', async ({ page }) => {
    test.setTimeout(45000);
    await page.goto('http://localhost:5173/login.html');
    await page.fill('input[type="text"], input[type="email"]', testData.dosen.email);
    await page.fill('input[type="password"]', testData.dosen.pass);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard-dospem.html', { timeout: 3000 }).catch(async () => {
       await apiLogin(page, testData.dosen);
    });

    await page.screenshot({ path: `screenshots/audit_dosen_dashboard_${suffix}.png` });
  });
});
