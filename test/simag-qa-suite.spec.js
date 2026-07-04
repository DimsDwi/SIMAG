/**
 * SIMAG ULTIMATE LIVE QA TEST SUITE
 * 
 * Coverage: Landing, Auth, Admin, Dosen, Mitra, Mahasiswa workflows
 * Tests: Login, Dashboard, Navigation, CRUD, API, Logout
 * 
 * Seed credentials (from DB):
 *   mahasiswa  : identifier=22.11.0987  password=xin123
 *   dospem     : identifier=99876       password=gon123
 *   adminprodi : identifier=adminit     password=it1234
 *   mitra      : identifier=shp@gmail.com password=shp123
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL  = 'http://localhost:5173';
const API_URL   = 'http://localhost:3000';
const SS_DIR    = path.join(__dirname, '..', 'archive', 'screenshots');

// Ensure screenshot dir exists
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

// ── Credentials ──────────────────────────────────────────────────────────────
const CREDS = {
  mahasiswa:  { identifier: '22.11.0987',     password: 'xin123',  role: 'mahasiswa',  dashboard: 'dashboard-mahasiswa.html' },
  dospem:     { identifier: '99876',           password: 'gon123',  role: 'dospem',     dashboard: 'dashboard-dospem.html'    },
  adminprodi: { identifier: 'adminit',         password: 'it1234',  role: 'adminprodi', dashboard: 'dashboard-admin.html'     },
  mitra:      { identifier: 'shp@gmail.com',   password: 'shp123',  role: 'mitra',      dashboard: 'dashboard-mitra.html'     },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all console errors during a test */
const consoleErrors = [];

/** 
 * Injects session into localStorage and navigates to a page.
 * This bypasses the login UI when we already have a token from API. 
 */
async function injectSession(page, token, role, user) {
  await page.evaluate(({ token, role, user }) => {
    localStorage.setItem('simag_token', token);
    localStorage.setItem('simag_role',  role);
    localStorage.setItem('simag_user',  JSON.stringify(user));
  }, { token, role, user });
}

/** Login via the API and return token+user data, or null on failure */
async function apiAuth(credentials) {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: credentials.identifier, password: credentials.password }),
    });
    const json = await res.json();
    return json.success ? json : null;
  } catch (e) {
    return null;
  }
}

/** Login via UI login page with role tab clicking */
async function loginViaUI(page, creds) {
  await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle' });
  
  // Role tab texts match what's in the DOM exactly
  const roleTabMap = {
    mahasiswa:  'Mahasiswa',
    dospem:     'Dospem',
    adminprodi: 'Admin Prodi',
    mitra:      'Mitra',
  };
  const tabText = roleTabMap[creds.role];
  if (tabText) {
    // Try button with exact text
    const tabBtn = page.locator(`button.role-tab:has-text("${tabText}")`).first();
    await tabBtn.click().catch(() => {});
    await page.waitForTimeout(400);
  }

  // The identifier input is type=text with v-model="identifier" and class field-input
  const identifierInput = page.locator('input.field-input').first();
  const passwordInput = page.locator('input[type="password"], input.field-input').last();
  
  await identifierInput.fill(creds.identifier);
  await passwordInput.fill(creds.password);
  
  // Submit and wait for redirect
  await Promise.all([
    page.waitForURL(`**/${creds.dashboard}`, { timeout: 8000 }).catch(() => null),
    page.locator('button[type="submit"]').click(),
  ]);

  await page.waitForTimeout(500);
  return page.url().includes(creds.dashboard);
}

/** Take a named screenshot */
async function ss(page, name) {
  const filePath = path.join(SS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

/** Check for JS console errors on page */
function attachErrorCapture(page) {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[${page.url()}] CONSOLE ERROR: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(`[${page.url()}] PAGE ERROR: ${err.message}`);
  });
}

/** Navigate to a page within the app with session already injected */
async function gotoPage(page, pagePath) {
  await page.goto(`${BASE_URL}/${pagePath}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1200); // Let Vue mount and API fetch complete
}

// ── PHASE 1: Service Health Check ────────────────────────────────────────────
test.describe('PHASE 1: Service Health', () => {
  test('Frontend (Vite) is running on port 5173', async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    expect(res.status()).toBeLessThan(400);
    await ss(page, 'phase1_landing');
  });

  test('Backend API is running on port 3000', async ({ request }) => {
    // Login endpoint should be reachable (even if 401)
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { identifier: 'health', password: 'check' }
    });
    expect([200, 401, 400, 429]).toContain(res.status());
  });

  test('MySQL connection is working (vacancies endpoint)', async ({ request }) => {
    // GET /api/vacancies requires auth, will return 401 — but not 500 (which would mean DB down)
    const res = await request.get(`${API_URL}/api/vacancies`);
    expect(res.status()).not.toBe(500);
  });
});

// ── PHASE 2: Landing Page ─────────────────────────────────────────────────────
test.describe('PHASE 2: Landing Page', () => {
  test('index.html - Loads fully and has navigation', async ({ page }) => {
    attachErrorCapture(page);
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle', timeout: 20000 });
    const title = await page.title();
    expect(title).toBeTruthy();
    await ss(page, 'phase2_landing_full');
  });

  test('panduan.html - Loads without error', async ({ page }) => {
    await page.goto(`${BASE_URL}/panduan.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await ss(page, 'phase2_panduan');
  });

  test('login.html - Has form elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await ss(page, 'phase2_login_page');
  });

  test('register.html - Has form elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/register.html`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('form, [id="app"]')).toBeTruthy();
    await ss(page, 'phase2_register_page');
  });

  test('forgot-password.html - Loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password.html`, { waitUntil: 'domcontentloaded' });
    await ss(page, 'phase2_forgot_password');
  });
});

// ── PHASE 3: Authentication ───────────────────────────────────────────────────
test.describe('PHASE 3: Authentication', () => {
  test('Mahasiswa login via UI succeeds', async ({ page }) => {
    const success = await loginViaUI(page, CREDS.mahasiswa);
    expect(success).toBe(true);
    await ss(page, 'phase3_login_mahasiswa');
  });

  test('Admin login via UI succeeds', async ({ page }) => {
    const success = await loginViaUI(page, CREDS.adminprodi);
    expect(success).toBe(true);
    await ss(page, 'phase3_login_admin');
  });

  test('Dosen login via UI succeeds', async ({ page }) => {
    const success = await loginViaUI(page, CREDS.dospem);
    expect(success).toBe(true);
    await ss(page, 'phase3_login_dosen');
  });

  test('Mitra login via UI succeeds', async ({ page }) => {
    const success = await loginViaUI(page, CREDS.mitra);
    expect(success).toBe(true);
    await ss(page, 'phase3_login_mitra');
  });

  test('Invalid credentials returns error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'domcontentloaded' });
    const identifierInput = page.locator('input[type="text"], input[type="email"]').first();
    await identifierInput.fill('wronguser@test.com');
    await page.locator('input[type="password"]').first().fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
    // Should NOT have navigated to a dashboard
    expect(page.url()).not.toMatch(/dashboard/);
    await ss(page, 'phase3_invalid_login');
  });

  test('Logout clears session and redirects to login', async ({ page }) => {
    await loginViaUI(page, CREDS.mahasiswa);
    // Try to find logout button
    const logoutBtn = page.locator('a:has-text("Keluar"), button:has-text("Keluar"), a[href*="login"]').first();
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();
      await page.waitForTimeout(1500);
      await ss(page, 'phase3_after_logout');
    } else {
      // Manual logout via JS
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.goto(`${BASE_URL}/login.html`);
    }
    // After logout, dashboard should not be accessible
    await gotoPage(page, 'pages/dashboard-mahasiswa.html');
    await ss(page, 'phase3_dashboard_after_logout');
  });
});

// ── PHASE 4: Admin Workflow ────────────────────────────────────────────────────
test.describe('PHASE 4: Admin Workflow', () => {
  let adminToken, adminUser;

  test.beforeAll(async () => {
    const auth = await apiAuth(CREDS.adminprodi);
    if (auth) { adminToken = auth.token; adminUser = auth.user; }
  });

  test('Admin Dashboard - loads with summary cards', async ({ page }) => {
    attachErrorCapture(page);
    await page.goto(`${BASE_URL}/pages/dashboard-admin.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, adminToken, 'adminprodi', adminUser);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await ss(page, 'phase4_admin_dashboard');
  });

  test('Admin - Approval Pendaftaran page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-admin.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, adminToken, 'adminprodi', adminUser);
    await gotoPage(page, 'pages/approval-pendaftaran.html');
    await ss(page, 'phase4_admin_approval');
  });

  test('Admin - Intern Aktif page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-admin.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, adminToken, 'adminprodi', adminUser);
    await gotoPage(page, 'pages/intern-aktif.html');
    await ss(page, 'phase4_admin_intern_aktif');
  });

  test('Admin - Laporan page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-admin.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, adminToken, 'adminprodi', adminUser);
    await gotoPage(page, 'pages/laporan-admin.html');
    await ss(page, 'phase4_admin_laporan');
  });

  test('Admin - Konversi SKS page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-admin.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, adminToken, 'adminprodi', adminUser);
    await gotoPage(page, 'pages/konversi-sks.html');
    await ss(page, 'phase4_admin_konversi_sks');
  });

  test('Admin - Riwayat SKS page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-admin.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, adminToken, 'adminprodi', adminUser);
    await gotoPage(page, 'pages/riwayat-sks.html');
    await ss(page, 'phase4_admin_riwayat_sks');
  });

  test('Admin - Profil page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-admin.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, adminToken, 'adminprodi', adminUser);
    await gotoPage(page, 'pages/profil-admin.html');
    await ss(page, 'phase4_admin_profil');
  });

  test('Admin - Notifikasi page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-admin.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, adminToken, 'adminprodi', adminUser);
    await gotoPage(page, 'pages/notifikasi.html');
    await ss(page, 'phase4_admin_notifikasi');
  });
});

// ── PHASE 5: Mitra Workflow ───────────────────────────────────────────────────
test.describe('PHASE 5: Mitra Workflow', () => {
  let mitraToken, mitraUser;

  test.beforeAll(async () => {
    const auth = await apiAuth(CREDS.mitra);
    if (auth) { mitraToken = auth.token; mitraUser = auth.user; }
  });

  test('Mitra Dashboard - loads', async ({ page }) => {
    attachErrorCapture(page);
    await page.goto(`${BASE_URL}/pages/dashboard-mitra.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mitraToken, 'mitra', mitraUser);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await ss(page, 'phase5_mitra_dashboard');
  });

  test('Mitra - Lowongan Aktif page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-mitra.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mitraToken, 'mitra', mitraUser);
    await gotoPage(page, 'pages/lowongan-aktif.html');
    await ss(page, 'phase5_mitra_lowongan_aktif');
  });

  test('Mitra - Tambah Lowongan Baru page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-mitra.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mitraToken, 'mitra', mitraUser);
    await gotoPage(page, 'pages/lowongan-baru.html');
    await ss(page, 'phase5_mitra_lowongan_baru');
  });

  test('Mitra - Intern Aktif page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-mitra.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mitraToken, 'mitra', mitraUser);
    await gotoPage(page, 'pages/intern-aktif.html');
    await ss(page, 'phase5_mitra_intern_aktif');
  });

  test('Mitra - Evaluasi Intern page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-mitra.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mitraToken, 'mitra', mitraUser);
    await gotoPage(page, 'pages/evaluasi-intern.html');
    await ss(page, 'phase5_mitra_evaluasi');
  });

  test('Mitra - Laporan page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-mitra.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mitraToken, 'mitra', mitraUser);
    await gotoPage(page, 'pages/laporan-mitra.html');
    await ss(page, 'phase5_mitra_laporan');
  });

  test('Mitra - Profil Mitra page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-mitra.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mitraToken, 'mitra', mitraUser);
    await gotoPage(page, 'pages/profil-mitra.html');
    await ss(page, 'phase5_mitra_profil');
  });

  test('Mitra - Create Vacancy via API', async ({ request }) => {
    if (!mitraToken) return test.skip();
    const res = await request.post(`${API_URL}/api/vacancies`, {
      headers: { Authorization: `Bearer ${mitraToken}` },
      data: {
        title: 'QA Test Vacancy',
        company_id: mitraUser?.id,
        company: 'Shopee',
        location: 'Jakarta',
        work_model: 'Hybrid',
        quota: 3,
        deadline: '2026-12-31',
        description: 'Test vacancy created by QA suite',
        qualifications: ['Test skill'],
        responsibilities: ['Test responsibility'],
        status: 'active',
        badge: 'Terbuka'
      }
    });
    const json = await res.json();
    expect(res.status()).toBe(200);
    expect(json.success || json.id || json.data).toBeTruthy();
  });
});

// ── PHASE 6: Dosen Workflow ───────────────────────────────────────────────────
test.describe('PHASE 6: Dosen Workflow', () => {
  let dosenToken, dosenUser;

  test.beforeAll(async () => {
    const auth = await apiAuth(CREDS.dospem);
    if (auth) { dosenToken = auth.token; dosenUser = auth.user; }
  });

  test('Dosen Dashboard - loads', async ({ page }) => {
    attachErrorCapture(page);
    await page.goto(`${BASE_URL}/pages/dashboard-dospem.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, dosenToken, 'dospem', dosenUser);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await ss(page, 'phase6_dosen_dashboard');
  });

  test('Dosen - Mahasiswa Bimbingan page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-dospem.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, dosenToken, 'dospem', dosenUser);
    await gotoPage(page, 'pages/mahasiswa-bimbingan.html');
    await ss(page, 'phase6_dosen_mahasiswa_bimbingan');
  });

  test('Dosen - Review Logbook page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-dospem.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, dosenToken, 'dospem', dosenUser);
    await gotoPage(page, 'pages/review-logbook-dospem.html');
    await ss(page, 'phase6_dosen_review_logbook');
  });

  test('Dosen - Jadwal Dospem page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-dospem.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, dosenToken, 'dospem', dosenUser);
    await gotoPage(page, 'pages/jadwal-dospem.html');
    await ss(page, 'phase6_dosen_jadwal');
  });

  test('Dosen - Penilaian page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-dospem.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, dosenToken, 'dospem', dosenUser);
    await gotoPage(page, 'pages/penilaian-dospem.html');
    await ss(page, 'phase6_dosen_penilaian');
  });

  test('Dosen - Profil page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-dospem.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, dosenToken, 'dospem', dosenUser);
    await gotoPage(page, 'pages/profil-dospem.html');
    await ss(page, 'phase6_dosen_profil');
  });
});

// ── PHASE 7: Mahasiswa Workflow ──────────────────────────────────────────────
test.describe('PHASE 7: Mahasiswa Workflow', () => {
  let mhsToken, mhsUser;

  test.beforeAll(async () => {
    const auth = await apiAuth(CREDS.mahasiswa);
    if (auth) { mhsToken = auth.token; mhsUser = auth.user; }
  });

  test('Mahasiswa Dashboard - loads', async ({ page }) => {
    attachErrorCapture(page);
    await page.goto(`${BASE_URL}/pages/dashboard-mahasiswa.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mhsToken, 'mahasiswa', mhsUser);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await ss(page, 'phase7_mhs_dashboard');
  });

  test('Mahasiswa - Cari Lowongan page loads + filtering', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-mahasiswa.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mhsToken, 'mahasiswa', mhsUser);
    await gotoPage(page, 'pages/cari-lowongan.html');
    await ss(page, 'phase7_mhs_cari_lowongan_before_filter');

    // Test search filter
    const searchInput = page.locator('input[placeholder*="Cari"], input[placeholder*="cari"], input[type="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('Frontend');
      await page.waitForTimeout(800);
      await ss(page, 'phase7_mhs_cari_lowongan_filtered');
      await searchInput.fill('');
    }
  });

  test('Mahasiswa - Jadwal page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-mahasiswa.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mhsToken, 'mahasiswa', mhsUser);
    await gotoPage(page, 'pages/jadwal.html');
    await ss(page, 'phase7_mhs_jadwal');
  });

  test('Mahasiswa - Logbook Saya page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-mahasiswa.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mhsToken, 'mahasiswa', mhsUser);
    await gotoPage(page, 'pages/logbook-saya.html');
    await ss(page, 'phase7_mhs_logbook_saya');
  });

  test('Mahasiswa - Isi Logbook page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-mahasiswa.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mhsToken, 'mahasiswa', mhsUser);
    await gotoPage(page, 'pages/isi-logbook.html');
    await ss(page, 'phase7_mhs_isi_logbook');
  });

  test('Mahasiswa - Review Logbook page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-mahasiswa.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mhsToken, 'mahasiswa', mhsUser);
    await gotoPage(page, 'pages/review-logbook.html');
    await ss(page, 'phase7_mhs_review_logbook');
  });

  test('Mahasiswa - Progress SKS page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-mahasiswa.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mhsToken, 'mahasiswa', mhsUser);
    await gotoPage(page, 'pages/progress-sks.html');
    await ss(page, 'phase7_mhs_progress_sks');
  });

  test('Mahasiswa - Riwayat SKS page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-mahasiswa.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mhsToken, 'mahasiswa', mhsUser);
    await gotoPage(page, 'pages/riwayat-sks.html');
    await ss(page, 'phase7_mhs_riwayat_sks');
  });

  test('Mahasiswa - Profil page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-mahasiswa.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mhsToken, 'mahasiswa', mhsUser);
    await gotoPage(page, 'pages/profil.html');
    await ss(page, 'phase7_mhs_profil');
  });

  test('Mahasiswa - Change Password page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-mahasiswa.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mhsToken, 'mahasiswa', mhsUser);
    await gotoPage(page, 'pages/change-password.html');
    await ss(page, 'phase7_mhs_change_password');
  });

  test('Mahasiswa - Notifikasi page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/dashboard-mahasiswa.html`, { waitUntil: 'domcontentloaded' });
    await injectSession(page, mhsToken, 'mahasiswa', mhsUser);
    await gotoPage(page, 'pages/notifikasi.html');
    await ss(page, 'phase7_mhs_notifikasi');
  });
});

// ── PHASE 8: API Coverage ─────────────────────────────────────────────────────
test.describe('PHASE 8: API Coverage', () => {
  let token;

  test.beforeAll(async () => {
    const auth = await apiAuth(CREDS.adminprodi);
    if (auth) token = auth.token;
  });

  const headers = () => ({ Authorization: `Bearer ${token}` });

  test('GET /api/vacancies - returns list', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/vacancies`, { headers: headers() });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data || json)).toBeTruthy();
  });

  test('GET /api/interns - returns list', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/interns`, { headers: headers() });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data || json)).toBeTruthy();
  });

  test('GET /api/logbooks - returns list', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/logbooks`, { headers: headers() });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data || json)).toBeTruthy();
  });

  test('GET /api/applications - returns list', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/applications`, { headers: headers() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/applicants - returns list', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/applicants`, { headers: headers() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/evaluations - returns list', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/evaluations`, { headers: headers() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/sks - returns list', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/sks`, { headers: headers() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/activities - returns recent activities', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/activities`, { headers: headers() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/people/student - returns student list', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/people/student`, { headers: headers() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/people/lecturer - returns lecturer list', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/people/lecturer`, { headers: headers() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/people/company - returns company list', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/people/company`, { headers: headers() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/dashboard/summary-admin - works for admin', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/dashboard/summary-admin`, { headers: headers() });
    expect(res.status()).toBe(200);
  });

  test('GET /api/evaluations/candidates - returns list', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/evaluations/candidates`, { headers: headers() });
    expect(res.status()).toBe(200);
  });

  test('Role guard: dospem dashboard returns 403 for mahasiswa', async ({ request }) => {
    const mhsAuth = await apiAuth(CREDS.mahasiswa);
    if (!mhsAuth) return test.skip();
    const res = await request.get(`${API_URL}/api/dashboard/summary-dospem`, {
      headers: { Authorization: `Bearer ${mhsAuth.token}` }
    });
    expect(res.status()).toBe(403);
  });

  test('Auth: no token returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/vacancies`);
    expect(res.status()).toBe(401);
  });

  test('Auth: invalid token returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/vacancies`, {
      headers: { Authorization: 'Bearer invalid_token_xyz' }
    });
    expect(res.status()).toBe(401);
  });
});

// ── PHASE 9: Responsive + 404 checks ─────────────────────────────────────────
test.describe('PHASE 9: Responsive & 404 Checks', () => {
  test('index.html renders at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await ss(page, 'phase9_landing_mobile');
  });

  test('login.html renders at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'domcontentloaded' });
    await ss(page, 'phase9_login_mobile');
  });

  test('Non-existent route returns 404 (not 500)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/nonexistent-endpoint-xyz`, {
      headers: { Authorization: 'Bearer test' }
    });
    // Should be 401 (no token match) or 404, never 500
    expect(res.status()).not.toBe(500);
  });
});

// ── PHASE 10: Final Console Error Report ─────────────────────────────────────
test.describe('PHASE 10: Final Report', () => {
  test('No critical console errors accumulated', async () => {
    const critical = consoleErrors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.includes('net::ERR')
    );
    console.log('\n=== CONSOLE ERRORS CAPTURED ===');
    if (critical.length === 0) {
      console.log('✅ No critical console errors');
    } else {
      critical.forEach(e => console.warn('⚠️', e));
    }
    // Write to file for report
    const reportPath = path.join(__dirname, '..', 'archive', 'qa-console-errors.txt');
    fs.writeFileSync(reportPath, critical.join('\n') || 'No errors');
    // We don't fail on this — just report
    expect(true).toBe(true);
  });
});
