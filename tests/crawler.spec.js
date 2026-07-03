const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const projectRoot = path.join(rootDir, '..');

// Helper to get all HTML files recursively
function getHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'dist' || file === 'playwright-report' || file === 'test-results') continue;
    
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const htmlFiles = getHtmlFiles(projectRoot).map(f => path.relative(projectRoot, f).replace(/\\/g, '/'));

test.describe('Automated Full QA Crawler', () => {
  for (const file of htmlFiles) {
    test(`Crawl page: ${file}`, async ({ page }) => {
      const url = `http://localhost:5173/${file}`;
      const consoleLogs = [];
      const networkRequests = [];

      page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));
      page.on('request', req => networkRequests.push({ method: req.method(), url: req.url() }));
      
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => null);
      
      // Allow network to settle
      await page.waitForTimeout(1000);

      // Log checks
      const errors = consoleLogs.filter(l => l.type === 'error');
      
      // Capture screenshot
      const safeName = file.replace(/[\/\\]/g, '-').replace('.html', '');
      await page.screenshot({ path: `screenshots/${safeName}.png`, fullPage: true });

      // Click random interactive elements if they exist (buttons, links) to simulate interaction
      const interactables = await page.$$('button:visible, a:visible, input[type="button"]:visible');
      // Just click the first one lightly if it exists and isn't a direct navigation
      if (interactables.length > 0) {
        try {
          const text = await interactables[0].innerText();
          if (text) await interactables[0].click({ timeout: 500, trial: true });
        } catch (e) {}
      }

      // Assertions
      expect(res).not.toBeNull();
      if (res) {
        expect(res.status()).toBeLessThan(400); // no 404 or 500 on main document
      }
    });
  }
});
