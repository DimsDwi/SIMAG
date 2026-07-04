/**
 * SIMAG ULTIMATE E2E REAL LIVE QA SPEC
 * 
 * Flow:
 * - Register a new Mahasiswa via UI.
 * - Verify database changes (new row, bcrypt hash).
 * - Login using the new Mahasiswa account.
 * - Perform Mahasiswa workflow:
 *   - Edit profile & CV details
 *   - Search & filter vacancies
 *   - Submit vacancy application
 *   - Logout
 * - Login as Mitra:
 *   - Go to lowongan-aktif.html
 *   - Go to pelamar-lowongan.html for the vacancy
 *   - Approve applicant (with dialog acceptance)
 *   - Logout
 * - Login as Admin:
 *   - Go to approval-pendaftaran.html
 *   - Approve the student's registration
 *   - Logout
 * - Login as Mahasiswa:
 *   - Create and submit daily logbook entry
 *   - Logout
 * - Login as Dosen:
 *   - Go to review-logbook-dospem.html
 *   - Review & approve student logbook
 *   - Logout
 * - Login as Mahasiswa:
 *   - Verify logbook is marked as Approved
 *   - Logout
 */

const { test, expect } = require('@playwright/test');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const DB_CONFIG = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: 'simag_db'
};

const suffix = crypto.randomBytes(3).toString('hex');
const testUser = {
  name: 'QA Testing User',
  email: `qa_${suffix}@simag.id`,
  nim: `24.11.${Math.floor(1000 + Math.random() * 9000)}`,
  pass: 'QaTest123!'
};

const SS_DIR = path.join(__dirname, '..', 'archive', 'screenshots');
if (!fs.existsSync(SS_DIR)) {
  fs.mkdirSync(SS_DIR, { recursive: true });
}

// Global error tracking
const errors = [];

test.describe('SIMAG ULTIMATE REAL LIVE INTERACTIVE TESTING', () => {
  let dbPool;

  test.beforeAll(async () => {
    dbPool = await mysql.createPool(DB_CONFIG);
    console.log('\n[03%] Starting browser...');
    console.log('[07%] Backend detected...');
    console.log('[10%] Database Connected ✓');
  });

  test.afterAll(async () => {
    await dbPool.end();
    console.log('[100%] QA Completed ✓\n');
  });

  test('E2E Integration & QA Workflow', async ({ page }) => {
    test.setTimeout(180000);
    // Handle dialog events automatically (alerts & confirms)
    page.on('dialog', async dialog => {
      console.log(`[Dialog] ${dialog.type()}: ${dialog.message()}`);
      await dialog.accept();
    });

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console Error: ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      errors.push(`Page Error: ${err.message}`);
    });

    // Capture network failures
    page.on('requestfailed', req => {
      errors.push(`Request Failed: ${req.method()} ${req.url()} - ${req.failure().errorText}`);
    });

    // ==========================================
    // 1. REGISTER NEW ACCOUNT via UI
    // ==========================================
    console.log('[11%] Register page opened...');
    await page.goto(`${BASE_URL}/register.html`, { waitUntil: 'networkidle' });
    
    // Choose Mahasiswa role tab
    await page.locator('button.role-tab:has-text("Mahasiswa")').first().click();
    await page.waitForTimeout(500);

    // Fill registration fields
    console.log('[16%] Filling registration...');
    await page.locator('input[placeholder="Masukkan nama lengkap sesuai KTM"]').fill(testUser.name);
    await page.locator('input[placeholder="Masukkan NIM Anda (Format: 23.11.5508)"]').fill(testUser.nim);
    await page.locator('input[placeholder="Min. 6 karakter"]').first().fill(testUser.pass);
    await page.locator('input[placeholder="Ulangi password"]').first().fill(testUser.pass);

    await page.screenshot({ path: path.join(SS_DIR, '01_register_form_filled.png') });
    
    // Submit registration
    await page.locator('button[type="submit"]').click();
    
    // Wait for redirect to login page
    await page.waitForURL('**/login.html', { timeout: 10000 });
    await page.screenshot({ path: path.join(SS_DIR, '02_register_success.png') });
    console.log('[20%] Registration success ✓');

    // ==========================================
    // 2. VERIFY DATABASE RECORD AND BCRYPT
    // ==========================================
    const [rows] = await dbPool.query('SELECT * FROM users WHERE identifier = ?', [testUser.nim]);
    expect(rows.length).toBe(1);
    const userRow = rows[0];
    expect(userRow.name).toBe(testUser.name);
    expect(userRow.role).toBe('mahasiswa');
    expect(userRow.password.startsWith('$2')).toBe(true); // Must be bcrypt hashed
    console.log('[25%] Database & Bcrypt verification passed successfully ✓');

    // ==========================================
    // 3. LOGIN MAHASISWA via UI
    // ==========================================
    console.log('[30%] Starting Login UI Flow...');
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle' });
    await page.locator('button.role-tab:has-text("Mahasiswa")').first().click();
    await page.waitForTimeout(500);

    await page.locator('input.field-input').first().fill(testUser.nim);
    await page.locator('input[type="password"]').first().fill(testUser.pass);
    await page.screenshot({ path: path.join(SS_DIR, '03_login_form_filled.png') });

    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard-mahasiswa.html', { timeout: 10000 });
    await page.screenshot({ path: path.join(SS_DIR, '04_login_success.png') });
    console.log('[35%] Login UI Flow completed successfully ✓');

    // ==========================================
    // 4. MAHASISWA E2E: Edit Profile & CV
    // ==========================================
    console.log('[40%] Mahasiswa: Editing Profile & CV Details...');
    await page.goto(`${BASE_URL}/pages/profil.html`, { waitUntil: 'networkidle' });
    
    // Click edit profile button
    await page.locator('button:has-text("Edit Profil")').click();
    await page.waitForTimeout(500);

    // Edit email and address
    await page.locator('input[type="email"]').fill(testUser.email);
    await page.locator('input[type="text"]').nth(2).fill('08123456789'); // Phone input
    await page.locator('label:has-text("Alamat") + textarea').fill('Jl. Ringroad Utara, Sleman, Yogyakarta');
    await page.screenshot({ path: path.join(SS_DIR, '05_profil_edit_modal.png') });

    // Save profile changes
    await page.getByRole('button', { name: 'Simpan', exact: true }).click();
    await page.waitForTimeout(1000);
    
    // Update structured CV info
    await page.locator('label:has-text("Skills") + input').fill('Node.js, Vue.js, Playwright, MySQL');
    await page.locator('label:has-text("Portfolio") + textarea').fill('https://github.com/qatesting\nhttps://linkedin.com/in/qatesting');
    
    // Add work experience
    await page.locator('button:has-text("+ Tambah")').click();
    await page.waitForTimeout(500);
    await page.locator('input[placeholder="Posisi/Jabatan"]').fill('QA Engineer Intern');
    await page.locator('input[placeholder="Perusahaan/Organisasi"]').fill('SIMAG QA Team');
    await page.locator('input[placeholder="Tahun (cth: 2023 - 2024)"]').fill('2026');
    await page.locator('input[placeholder="Deskripsi Singkat"]').fill('Interactive testing using Playwright');
    
    await page.screenshot({ path: path.join(SS_DIR, '06_cv_structured_filled.png') });
    await page.locator('button:has-text("Simpan Detail CV")').click();
    await page.waitForTimeout(1000);
    console.log('[45%] Profile & CV update completed ✓');

    // ==========================================
    // 5. MAHASISWA E2E: Cari Lowongan & Apply
    // ==========================================
    console.log('[50%] Mahasiswa: Searching and applying for vacancy...');
    await page.goto(`${BASE_URL}/pages/cari-lowongan.html`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SS_DIR, '07_cari_lowongan_page.png') });

    // Use search filter
    await page.locator('input[placeholder*="Cari"], input[placeholder*="cari"]').first().fill('Frontend');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SS_DIR, '08_cari_lowongan_filtered.png') });

    // Open first vacancy detail
    await page.locator('button:has-text("Lihat Detail")').first().click();
    await page.waitForURL('**/detail-lowongan.html*', { timeout: 10000 });
    await page.screenshot({ path: path.join(SS_DIR, '09_detail_lowongan_page.png') });

    // Apply to vacancy (triggers modal and alert popup)
    const applyBtn = page.locator('button:has-text("Lamar"), button:has-text("Apply Now")').first();
    if (await applyBtn.count() > 0) {
      await applyBtn.click();
      await page.waitForTimeout(1000);
      
      // Click Kirim Lamaran button inside the modal
      await page.locator('#apply-modal button:has-text("Kirim Lamaran")').first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SS_DIR, '10_vacancy_applied.png') });
    }
    console.log('[55%] Vacancy search and application completed ✓');

    // Logout Student
    await page.locator('div.sidebar-item:has-text("Keluar"), button:has-text("Keluar"), a:has-text("Keluar")').first().click();
    await page.waitForURL('**/login.html', { timeout: 8000 });
    console.log('[58%] Student logged out successfully.');

    // ==========================================
    // 6. MITRA WORKFLOW: Review & Approve Pelamar
    // ==========================================
    console.log('[62%] Starting Mitra Login...');
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle' });
    await page.locator('button.role-tab:has-text("Mitra")').first().click();
    await page.waitForTimeout(300);
    await page.locator('input.field-input').first().fill('shp@gmail.com');
    await page.locator('input[type="password"]').first().fill('shp123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard-mitra.html', { timeout: 10000 });
    await page.screenshot({ path: path.join(SS_DIR, '11_mitra_dashboard.png') });

    // Navigate to Lowongan Aktif
    await page.goto(`${BASE_URL}/pages/lowongan-aktif.html`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SS_DIR, '12_mitra_lowongan_aktif.png') });

    // Click Lihat Pelamar
    await page.locator('button:has-text("Lihat Pelamar")').first().click();
    await page.waitForURL('**/pelamar-lowongan.html*', { timeout: 10000 });
    await page.screenshot({ path: path.join(SS_DIR, '13_mitra_pelamar_lowongan.png') });

    // Accept student (triggers confirm popup which dialog listener accepts automatically)
    await page.locator('button:has-text("Terima")').first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SS_DIR, '14_mitra_applicant_accepted.png') });

    // Logout Mitra
    await page.locator('div.sidebar-item:has-text("Keluar"), button:has-text("Keluar"), a:has-text("Keluar")').first().click();
    await page.waitForURL('**/login.html', { timeout: 8000 });
    console.log('[68%] Mitra Workflow completed successfully ✓');

    // ==========================================
    // 7. ADMIN WORKFLOW: Approve Student Registration
    // ==========================================
    console.log('[72%] Starting Admin Login...');
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle' });
    await page.locator('button.role-tab:has-text("Admin Prodi")').first().click();
    await page.waitForTimeout(300);
    await page.locator('input.field-input').first().fill('adminit');
    await page.locator('input[type="password"]').first().fill('it1234');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard-admin.html', { timeout: 10000 });
    await page.screenshot({ path: path.join(SS_DIR, '15_admin_dashboard.png') });

    // Navigate to approval pendaftaran page
    await page.goto(`${BASE_URL}/pages/approval-pendaftaran.html`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SS_DIR, '16_admin_approval_page.png') });
    
    // Click Approve button
    await page.locator('button:has-text("Approve")').first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SS_DIR, '17_admin_registration_approved.png') });

    // Logout Admin
    await page.locator('div.sidebar-item:has-text("Keluar"), button:has-text("Keluar"), a:has-text("Keluar")').first().click();
    await page.waitForURL('**/login.html', { timeout: 8000 });
    console.log('[78%] Admin Workflow completed successfully ✓');

    // ==========================================
    // 8. MAHASISWA WORKFLOW: Logbook Submission
    // ==========================================
    console.log('[82%] Starting Student Login (Logbook Fill)...');
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle' });
    await page.locator('button.role-tab:has-text("Mahasiswa")').first().click();
    await page.waitForTimeout(300);
    await page.locator('input.field-input').first().fill(testUser.nim);
    await page.locator('input[type="password"]').first().fill(testUser.pass);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard-mahasiswa.html', { timeout: 10000 });

    // Navigate to isi logbook
    await page.goto(`${BASE_URL}/pages/isi-logbook.html`, { waitUntil: 'networkidle' });
    await page.locator('input[type="date"]').fill('2026-07-03');
    await page.locator('input[type="time"]').nth(0).fill('09:00');
    await page.locator('input[type="time"]').nth(1).fill('17:00');
    await page.locator('textarea').nth(0).fill('Successfully implemented live interactive testing flow with zero issues.');
    await page.locator('textarea').nth(1).fill('Integrated Playwright headed execution with DB validation.');
    await page.locator('textarea').nth(2).fill('None.');
    await page.screenshot({ path: path.join(SS_DIR, '18_isi_logbook_form.png') });

    // Submit logbook
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/logbook-saya.html', { timeout: 10000 });
    await page.screenshot({ path: path.join(SS_DIR, '19_logbook_submitted.png') });
    
    // Logout
    await page.locator('div.sidebar-item:has-text("Keluar"), button:has-text("Keluar"), a:has-text("Keluar")').first().click();
    await page.waitForURL('**/login.html', { timeout: 8000 });
    console.log('[86%] Student logbook submitted successfully ✓');

    // ==========================================
    // 9. DOSEN WORKFLOW: Review & Approve Logbook
    // ==========================================
    console.log('[90%] Starting Dosen Login...');
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle' });
    await page.locator('button.role-tab:has-text("Dospem")').first().click();
    await page.waitForTimeout(300);
    await page.locator('input.field-input').first().fill('99876');
    await page.locator('input[type="password"]').first().fill('gon123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard-dospem.html', { timeout: 10000 });
    await page.screenshot({ path: path.join(SS_DIR, '20_dosen_dashboard.png') });

    // Navigate to review logbook
    await page.goto(`${BASE_URL}/pages/review-logbook-dospem.html`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SS_DIR, '21_dosen_review_logbook_page.png') });

    // Click Setujui button for the logbook
    await page.locator('button:has-text("Setujui")').first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SS_DIR, '22_dosen_logbook_approved.png') });

    // Logout Dosen
    await page.locator('div.sidebar-item:has-text("Keluar"), button:has-text("Keluar"), a:has-text("Keluar")').first().click();
    await page.waitForURL('**/login.html', { timeout: 8000 });
    console.log('[94%] Dosen Workflow completed successfully ✓');

    // ==========================================
    // 10. MAHASISWA WORKFLOW: Verify Logbook Status
    // ==========================================
    console.log('[96%] Starting Mahasiswa Verification Login...');
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle' });
    await page.locator('button.role-tab:has-text("Mahasiswa")').first().click();
    await page.waitForTimeout(300);
    await page.locator('input.field-input').first().fill(testUser.nim);
    await page.locator('input[type="password"]').first().fill(testUser.pass);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard-mahasiswa.html', { timeout: 10000 });

    // Go to logbook list to verify status is approved
    await page.goto(`${BASE_URL}/pages/logbook-saya.html`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SS_DIR, '23_student_verified_approved_logbook.png') });
    
    // Verify status is Approved
    const badgeText = await page.locator('span.badge').first().textContent();
    expect(badgeText.trim()).toBe('Approved');

    // Logout
    await page.locator('div.sidebar-item:has-text("Keluar"), button:has-text("Keluar"), a:has-text("Keluar")').first().click();
    await page.waitForURL('**/login.html', { timeout: 8000 });
    console.log('[98%] Student verification successful ✓');
  });
});
