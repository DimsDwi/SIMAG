const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Throttle network to Slow 3G
  const client = await page.target().createCDPSession();
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (500 * 1024) / 8,
    uploadThroughput: (500 * 1024) / 8,
    latency: 400
  });

  let metrics = {
    apiRequests: 0,
    domMutations: 0,
    vueRenders: 0 // Inferred from DOM mutations changing actual text
  };

  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      metrics.apiRequests++;
    }
    request.continue();
  });

  page.on('console', msg => {
    if (msg.text().startsWith('MUTATION:')) {
      metrics.domMutations++;
    }
  });

  await page.evaluateOnNewDocument(() => {
    // Inject localStorage
    localStorage.setItem('simag_token', 'fake-token');
    localStorage.setItem('simag_role', 'dospem');
    localStorage.setItem('simag_user', JSON.stringify({ id: '1', name: 'Budi Santoso' }));

    // Inject MutationObserver
    document.addEventListener('DOMContentLoaded', () => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              // Ignore text nodes that are empty
              if (node.nodeType === 3 && node.textContent.trim() === '') return;
              // Ignore script tags
              if (node.tagName === 'SCRIPT') return;
              console.log('MUTATION: ADDED ' + (node.tagName || 'TEXT'));
            });
            mutation.removedNodes.forEach(node => {
              if (node.nodeType === 3 && node.textContent.trim() === '') return;
              if (node.tagName === 'SCRIPT') return;
              console.log('MUTATION: REMOVED ' + (node.tagName || 'TEXT'));
            });
          } else if (mutation.type === 'attributes') {
             // We only care about layout shifts or visible changes like class toggles (v-show)
             if (mutation.attributeName === 'style' && mutation.target.style.display !== 'none') {
                 // console.log('MUTATION: STYLE ' + mutation.target.tagName);
             }
          }
        });
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    });
  });

  for (let i = 0; i < 10; i++) {
    await page.setCacheEnabled(false);
    await page.goto('http://localhost:8080/pages/dashboard-dospem.html', { waitUntil: 'networkidle0' });
  }

  console.log(JSON.stringify(metrics));
  await browser.close();
})();
