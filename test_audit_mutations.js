const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'simag-super-secret-key-2026';

const baseUrl = 'http://localhost:3001';

// Generate tokens for different roles
const adminToken = jwt.sign({ id: 'admin-1', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
const studentToken = jwt.sign({ id: 'student-1', role: 'mahasiswa' }, JWT_SECRET, { expiresIn: '1h' });

// All mutation routes extracted from server.js
const mutationRoutes = [
  // People
  { method: 'POST', path: '/api/people/role/mahasiswa', body: { name: 'Test Student', phone: '08123' }, desc: 'Save role profile' },

  // Company Profile
  { method: 'POST', path: '/api/company-profile', body: { name: 'PT Test', address: 'Jakarta' }, desc: 'Save company profile' },

  // Logbooks
  { method: 'POST', path: '/api/logbooks', body: { title: 'Test Logbook', content: 'Hari ini saya belajar', date: '2026-06-26' }, desc: 'Add logbook' },
  { method: 'PUT', path: '/api/logbooks/lb-test-001', body: { title: 'Updated', content: 'Updated content' }, desc: 'Update logbook' },
  { method: 'POST', path: '/api/logbooks/lb-test-001/approve', body: {}, desc: 'Approve logbook' },
  { method: 'POST', path: '/api/logbooks/lb-test-001/revision', body: { note: 'Please fix' }, desc: 'Request logbook revision' },

  // Vacancies
  { method: 'POST', path: '/api/vacancies', body: { title: 'Web Dev Intern', company: 'PT Test', description: 'Cari intern', requirements: 'JS, HTML' }, desc: 'Add vacancy' },
  { method: 'PUT', path: '/api/vacancies/vac-test-001', body: { title: 'Updated Vacancy' }, desc: 'Update vacancy' },

  // Applicants
  { method: 'PUT', path: '/api/applicants/app-test-001', body: { status: 'approved' }, desc: 'Update applicant' },

  // Applications
  { method: 'POST', path: '/api/applications/apply', body: { vacancyId: 'vac-test-001' }, desc: 'Apply for vacancy' },
  { method: 'POST', path: '/api/applications/app-test-001/approve', body: {}, desc: 'Approve application' },

  // SKS
  { method: 'POST', path: '/api/sks/convert', body: { studentId: 'student-1', sks: 3 }, desc: 'Convert SKS' },
  { method: 'DELETE', path: '/api/sks/convert/student-1', body: null, desc: 'Delete SKS conversion' },

  // Evaluations
  { method: 'POST', path: '/api/evaluations', body: { candidateId: 'student-1', score: 85, feedback: 'Good' }, desc: 'Save evaluation' },

  // GET endpoints that also use jsonService (also test with params)
  { method: 'GET', path: '/api/interns/intern-test-001', body: null, desc: 'Get single intern' },
  { method: 'GET', path: '/api/logbooks/lb-test-001', body: null, desc: 'Get single logbook' },
  { method: 'GET', path: '/api/vacancies/vac-test-001', body: null, desc: 'Get single vacancy' },
  { method: 'GET', path: '/api/applicants/app-test-001', body: null, desc: 'Get single applicant' },
  { method: 'GET', path: '/api/applicants?vacancyId=vac-test-001', body: null, desc: 'Get applicants by vacancy' },
  { method: 'GET', path: '/api/evaluations/candidates', body: null, desc: 'Get evaluation candidates' },
  { method: 'GET', path: '/api/evaluations/student-1', body: null, desc: 'Get evaluation by candidateId' },
  { method: 'GET', path: '/api/interns/intern-test-001/logbooks/latest', body: null, desc: 'Get latest logbook for intern' },
  { method: 'GET', path: '/api/interns/intern-test-001/logbooks/pending', body: null, desc: 'Get pending logbook for intern' },
];

async function runAudit() {
  console.log('=== FASE 2: DEEP AUDIT — MUTATION ENDPOINTS ===\n');
  console.log(`Using admin token: ${adminToken.substring(0, 20)}...`);
  console.log(`Total routes to test: ${mutationRoutes.length}\n`);

  const results = { pass: [], fail500: [], failOther: [] };

  for (const route of mutationRoutes) {
    const fetchOpts = {
      method: route.method,
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    };
    if (route.body && ['POST', 'PUT', 'PATCH'].includes(route.method)) {
      fetchOpts.body = JSON.stringify(route.body);
    }

    try {
      const res = await fetch(baseUrl + route.path, fetchOpts);
      const bodyText = await res.text();
      let bodyJson;
      try { bodyJson = JSON.parse(bodyText); } catch { bodyJson = bodyText; }

      if (res.status === 500) {
        const errMsg = bodyJson?.error || bodyJson?.message || bodyText.substring(0, 100);
        console.log(`❌ [500] ${route.method} ${route.path} — ${route.desc}`);
        console.log(`         Error: ${errMsg}`);
        results.fail500.push({ ...route, status: 500, error: errMsg });
      } else if (res.status >= 400) {
        console.log(`⚠️  [${res.status}] ${route.method} ${route.path} — ${route.desc}`);
        results.failOther.push({ ...route, status: res.status, error: bodyJson?.message || '' });
      } else {
        console.log(`✅ [${res.status}] ${route.method} ${route.path} — ${route.desc}`);
        results.pass.push({ ...route, status: res.status });
      }
    } catch (err) {
      console.log(`❌ [ERR] ${route.method} ${route.path} — ${route.desc}: ${err.message}`);
      results.fail500.push({ ...route, status: 'ERR', error: err.message });
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`✅ Passed (2xx): ${results.pass.length}`);
  console.log(`⚠️  Client Error (4xx): ${results.failOther.length}`);
  console.log(`❌ Server Error (500/ERR): ${results.fail500.length}`);

  if (results.fail500.length > 0) {
    console.log('\n=== PETA RANJAU (500 Errors) ===');
    for (const f of results.fail500) {
      console.log(`  ${f.method} ${f.path} → ${f.error}`);
    }
  }

  if (results.failOther.length > 0) {
    console.log('\n=== CLIENT ERRORS (4xx - Graceful) ===');
    for (const f of results.failOther) {
      console.log(`  [${f.status}] ${f.method} ${f.path} → ${f.error}`);
    }
  }

  console.log('\n=== FASE 2 COMPLETE ===');
  process.exit(0);
}

runAudit();
