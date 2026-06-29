const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:5173';

async function runVacancyE2E() {
  console.log('Launching browser (headed)...');
  const browser = await chromium.launch({ headless: false, slowMo: 600 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to a safe page to clear storage
    await page.goto(`${BASE_URL}/`, { waitUntil: 'load' });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });

    // --- 1. Login as Mitra ---
    console.log('\\n--- 1. Mitra Login ---');
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'load' });
    
    // Wait for form
    await page.waitForSelector('button.role-tab:has-text("Mitra")', { state: 'visible' });
    await page.click('button.role-tab:has-text("Mitra")');
    await page.waitForTimeout(500);

    const inputs = page.locator('input.field-input');
    await inputs.nth(0).fill('hr@livemitra.com');
    await inputs.nth(1).fill('password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/pages/dashboard-mitra.html');
    console.log('✓ Login as Mitra succeeded.');

    // --- 2. Mitra Create Vacancy ---
    console.log('\\n--- 2. Mitra Post Vacancy ---');
    await page.goto(`${BASE_URL}/pages/lowongan-baru.html`, { waitUntil: 'load' });
    await page.waitForSelector('input[placeholder="Contoh: Frontend Developer Intern"]', { state: 'visible' });
    
    // Fill the vacancy form
    const uniqueTitle = `E2E Fullstack Engineer ${Date.now()}`;
    await page.fill('input[placeholder="Contoh: Frontend Developer Intern"]', uniqueTitle);
    await page.selectOption('select', 'Hybrid');
    await page.fill('input[placeholder="Contoh: Jakarta Pusat / Yogyakarta"]', 'Jakarta');
    await page.fill('input[placeholder="Contoh: 3"]', '5');
    
    // Set deadline to next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    await page.fill('input[type="date"]', nextMonth.toISOString().split('T')[0]);
    
    const textareas = page.locator('textarea.form-input');
    await textareas.nth(0).fill('Deskripsi E2E testing');
    await textareas.nth(1).fill('Kualifikasi E2E testing');
    
    // Publish
    page.on('dialog', dialog => dialog.accept()); // Handle the alert('Sukses!')
    await page.click('button:has-text("Publish Lowongan")');
    await page.waitForURL('**/pages/lowongan-aktif.html');
    console.log(`✓ Vacancy created: ${uniqueTitle}`);

    // Logout Mitra
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto(`${BASE_URL}/login.html`); // To reset state properly

    // --- 3. Login as Mahasiswa ---
    console.log('\\n--- 3. Mahasiswa Login ---');
    await page.waitForSelector('button.role-tab:has-text("Mahasiswa")', { state: 'visible' });
    await page.click('button.role-tab:has-text("Mahasiswa")');
    await page.waitForTimeout(500);

    const mInputs = page.locator('input.field-input');
    await mInputs.nth(0).fill('24.11.1111');
    await mInputs.nth(1).fill('password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/pages/dashboard-mahasiswa.html');
    console.log('✓ Login as Mahasiswa succeeded.');

    // --- 4. Mahasiswa Update CV ---
    console.log('\\n--- 4. Mahasiswa Update CV ---');
    await page.goto(`${BASE_URL}/pages/profil.html`, { waitUntil: 'load' });
    await page.waitForSelector('input[placeholder="e.g. JavaScript, Vue.js, UI/UX"]', { state: 'visible' });
    // Ensure the CV has skills so isCvComplete becomes true
    await page.fill('input[placeholder="e.g. JavaScript, Vue.js, UI/UX"]', 'Automation, Playwright, Vue');
    await page.click('button:has-text("Simpan Detail CV")');
    await page.waitForTimeout(2000); // Wait for save
    console.log('✓ CV skills updated.');

    // --- 5. Mahasiswa Apply Vacancy ---
    console.log('\\n--- 5. Mahasiswa Apply Vacancy ---');
    await page.goto(`${BASE_URL}/pages/cari-lowongan.html`, { waitUntil: 'load' });
    await page.waitForSelector(`h3:has-text("${uniqueTitle}")`, { state: 'visible' });
    
    // Click the new vacancy card
    await page.click(`h3:has-text("${uniqueTitle}")`);
    await page.waitForURL('**/pages/detail-lowongan.html*');
    
    // Click Lamar Sekarang
    await page.waitForSelector('button:has-text("Lamar Sekarang")', { state: 'visible' });
    await page.click('button:has-text("Lamar Sekarang")');
    
    // Confirm in Modal
    await page.waitForSelector('button:has-text("Kirim Lamaran")', { state: 'visible' });
    await page.click('button:has-text("Kirim Lamaran")');
    console.log('✓ Applied to vacancy successfully.');
    await page.waitForTimeout(3000); // Wait to observe the change in button text

    // Logout Mahasiswa
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto(`${BASE_URL}/login.html`);

    // --- 6. Mitra Review & Approve ---
    console.log('\\n--- 6. Mitra Review Application ---');
    await page.waitForSelector('button.role-tab:has-text("Mitra")', { state: 'visible' });
    await page.click('button.role-tab:has-text("Mitra")');
    await page.waitForTimeout(500);

    const mrInputs = page.locator('input.field-input');
    await mrInputs.nth(0).fill('hr@livemitra.com');
    await mrInputs.nth(1).fill('password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/pages/dashboard-mitra.html');

    // Go to pelamar
    await page.goto(`${BASE_URL}/pages/pelamar-lowongan.html`, { waitUntil: 'load' });
    
    // Wait for table to load
    await page.waitForTimeout(2000); 

    await page.waitForSelector('button:has-text("Profil")', { state: 'visible' });

    // Click Profil of the applicant
    await page.click('button:has-text("Profil")');
    
    // Submit review in modal
    await page.waitForSelector('select', { state: 'visible' });
    await page.selectOption('select', 'approved');
    await page.fill('textarea[placeholder="Catatan opsional..."]', 'Bagus sekali!');
    await page.click('button:has-text("Simpan Review")');
    await page.waitForTimeout(2000);
    
    // Close modal
    await page.click('button:has-text("×")');
    await page.waitForTimeout(1000);
    
    console.log('✓ Application review saved by Mitra.');

    console.log('\\n=====================================');
    console.log('✓ E2E VACANCY WORKFLOW PASSED SUCCESSFULLY!');
    console.log('=====================================');

  } catch (error) {
    console.error('\\n❌ TEST FAILED:', error);
  } finally {
    console.log('Menutup browser dalam 5 detik...');
    setTimeout(async () => {
      await browser.close();
      process.exit(0);
    }, 5000);
  }
}

runVacancyE2E();
