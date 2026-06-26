
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'simag-super-secret-key-2026';
const token = jwt.sign({ id: 'admin-1', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

const baseUrl = 'http://localhost:3001';

const routes = [
  { method: 'GET', path: '/api/data' },
  { method: 'GET', path: '/api/dashboard/summary' },
  { method: 'GET', path: '/api/dashboard/summary-mitra' },
  { method: 'GET', path: '/api/dashboard/summary-admin' },
  { method: 'GET', path: '/api/dashboard/summary-dospem' },
  { method: 'GET', path: '/api/people/student' },
  { method: 'GET', path: '/api/people/lecturer' },
  { method: 'GET', path: '/api/people/company' },
  { method: 'GET', path: '/api/company-profile' },
  { method: 'GET', path: '/api/interns' },
  { method: 'GET', path: '/api/logbooks' },
  { method: 'GET', path: '/api/vacancies' },
  { method: 'GET', path: '/api/applications' },
  { method: 'GET', path: '/api/sks' },
  { method: 'GET', path: '/api/evaluations' },
  { method: 'GET', path: '/api/activities' }
];

async function runAudit() {
  console.log(`Starting Audit... Using Token: ${token.substring(0,20)}...`);
  
  let failed = 0;
  
  for (const r of routes) {
    try {
      const res = await fetch(baseUrl + r.path, {
        method: r.method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      const body = await res.text();
      
      if (res.status === 500) {
        console.log(`❌ [500] ${r.method} ${r.path} -> ${body}`);
        failed++;
      } else {
        console.log(`✅ [${res.status}] ${r.method} ${r.path}`);
      }
    } catch(e) {
      console.log(`❌ [ERR] ${r.method} ${r.path} -> ${e.message}`);
    }
  }
  
  console.log(`\nAudit Complete. Found ${failed} endpoints throwing HTTP 500.`);
  process.exit();
}

runAudit();
