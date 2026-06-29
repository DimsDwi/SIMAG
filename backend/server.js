const express = require('express');
const cors = require('cors');
const service = require('./simag-service-mysql');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'simag-super-secret-key-2026';

// Auth Token Validation Middleware
const authMiddleware = (req, res, next) => {
  // Allow public auth endpoints
  if (req.path === '/api/auth/login' || req.path === '/api/auth/register') {
    return next();
  }

  // Only protect /api routes
  if (!req.path.startsWith('/api')) {
    return next();
  }

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains id, role, etc.
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
  }
};

app.use(authMiddleware);

function getUserId(req) {
  return req.user ? req.user.id : null;
}

// Authentication
app.post('/api/auth/login', asyncRoute(async (req, res) => {
  if (typeof service.login !== 'function') {
    return res.status(501).json({ success: false, message: 'Service method login is missing' });
  }
  const result = await service.login(req.body);
  if (result.success) res.json(result);
  else res.status(401).json(result);
}));

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  if (typeof service.register !== 'function') {
    return res.status(501).json({ success: false, message: 'Service method register is missing' });
  }
  const result = await service.register(req.body);
  if (result.success) {
    res.status(201).json(result);
  } else if (result.message === 'Akun sudah terdaftar.') {
    res.status(409).json(result);
  } else {
    res.status(400).json(result);
  }
}));

// Data export
app.get('/api/data', asyncRoute(async (req, res) => {
  res.json(await service.getData());
}));

app.get('/api/dashboard/summary', asyncRoute(async (req, res) => {
  const userId = getUserId(req);
  res.json(await service.getDashboardSummary(userId));
}));

app.get('/api/dashboard/summary-mitra', asyncRoute(async (req, res) => {
  const userId = getUserId(req);
  res.json(await service.getDashboardSummaryMitra(userId));
}));

app.get('/api/dashboard/summary-admin', asyncRoute(async (req, res) => {
  res.json(await service.getDashboardSummaryAdmin());
}));

app.get('/api/dashboard/summary-dospem', asyncRoute(async (req, res) => {
  const userId = getUserId(req);
  res.json(await service.getDashboardSummaryDospem(userId));
}));

// People
app.get('/api/people/student', asyncRoute(async (req, res) => res.json(await service.getStudent())));
app.get('/api/people/lecturer', asyncRoute(async (req, res) => res.json(await service.getLecturer())));
app.get('/api/people/company', asyncRoute(async (req, res) => res.json(await service.getCompany())));

app.post('/api/people/role/:role', asyncRoute(async (req, res) => {
  const result = await service.saveRoleProfile(req.params.role, req.body);
  res.json(result);
}));

// Company Profile
app.get('/api/company-profile', asyncRoute(async (req, res) => res.json(await service.getCompanyProfile())));
app.post('/api/company-profile', asyncRoute(async (req, res) => res.json(await service.saveCompanyProfile(req.body))));

// Interns
app.get('/api/interns', asyncRoute(async (req, res) => res.json(await service.getInterns())));
app.get('/api/interns/:id', asyncRoute(async (req, res) => res.json(await service.getIntern(req.params.id))));

// Logbooks
app.get('/api/logbooks', asyncRoute(async (req, res) => {
  const userId = getUserId(req);
  const role = req.user ? req.user.role : null;
  res.json(await service.getLogbooks(userId, role));
}));
app.post('/api/logbooks', asyncRoute(async (req, res) => {
  const userId = getUserId(req);
  res.json(await service.addLogbook(req.body, userId));
}));
app.get('/api/logbooks/:id', asyncRoute(async (req, res) => res.json(await service.getLogbook(req.params.id))));
app.put('/api/logbooks/:id', asyncRoute(async (req, res) => res.json(await service.updateLogbook(req.params.id, req.body))));
app.post('/api/logbooks/:id/approve', asyncRoute(async (req, res) => res.json(await service.approveLogbook(req.params.id))));
app.post('/api/logbooks/:id/revision', asyncRoute(async (req, res) => res.json(await service.requestLogbookRevision(req.params.id, req.body.note))));

app.get('/api/interns/:id/logbooks/latest', asyncRoute(async (req, res) => res.json(await service.getLatestLogbookForIntern(req.params.id))));
app.get('/api/interns/:id/logbooks/pending', asyncRoute(async (req, res) => res.json(await service.getPendingLogbookForIntern(req.params.id))));

app.get('/api/applications/:id/cv-reviews', asyncRoute(async (req, res) => res.json(await service.getApplicationReviews(req.params.id))));
app.post('/api/applications/:id/review-cv', asyncRoute(async (req, res) => res.json(await service.reviewApplicationCv(req.params.id, req.body.reviewerType, req.body))));

// Vacancies
app.get('/api/vacancies', asyncRoute(async (req, res) => res.json(await service.getVacancies())));
app.post('/api/vacancies', asyncRoute(async (req, res) => res.json(await service.addVacancy(req.body))));
app.get('/api/vacancies/:id', asyncRoute(async (req, res) => res.json(await service.getVacancy(req.params.id))));
app.put('/api/vacancies/:id', asyncRoute(async (req, res) => res.json(await service.updateVacancy(req.params.id, req.body))));
app.get('/api/vacancies/:id/requirements', asyncRoute(async (req, res) => {
  const reqs = await service.getVacancyRequirements(req.params.id);
  res.json(reqs || {});
}));
app.post('/api/vacancies/:id/requirements', asyncRoute(async (req, res) => res.json(await service.saveVacancyRequirements(req.params.id, req.body))));

// Applicants
app.get('/api/applicants', asyncRoute(async (req, res) => {
  const vacancyId = req.query.vacancyId;
  res.json(await service.getApplicants(vacancyId));
}));
app.get('/api/applicants/:id', asyncRoute(async (req, res) => res.json(await service.getApplicant(req.params.id))));
app.put('/api/applicants/:id', asyncRoute(async (req, res) => res.json(await service.updateApplicant(req.params.id, req.body))));

// Applications
app.get('/api/applications', asyncRoute(async (req, res) => res.json(await service.getApplications())));
app.post('/api/applications/apply', asyncRoute(async (req, res) => {
  const userId = getUserId(req);
  res.json(await service.applyVacancy(req.body.vacancyId, userId, req.body.cvFileId, req.body.cvDetailsId));
}));
app.post('/api/applications/:id/approve', asyncRoute(async (req, res) => res.json(await service.approveApplication(req.params.id))));
app.post('/api/applications/:id/review-cv', asyncRoute(async (req, res) => res.json(await service.reviewApplicationCv(req.params.id, req.body.reviewerType, req.body))));

// CV Management
app.get('/api/cv/:studentId', asyncRoute(async (req, res) => {
  const studentId = req.params.studentId === 'me' ? getUserId(req) : req.params.studentId;
  const file = await service.getCvFile(studentId);
  const details = await service.getCvDetails(studentId);
  res.json({ file, details });
}));
app.put('/api/cv/:studentId', asyncRoute(async (req, res) => {
  const studentId = req.params.studentId === 'me' ? getUserId(req) : req.params.studentId;
  res.json(await service.saveCvDetails(studentId, req.body));
}));
app.post('/api/cv/upload', asyncRoute(async (req, res) => {
  const userId = getUserId(req);
  res.json(await service.saveCvFile(userId, req.body.filePath, req.body.fileType));
}));
app.delete('/api/cv/:studentId/file', asyncRoute(async (req, res) => {
  const studentId = req.params.studentId === 'me' ? getUserId(req) : req.params.studentId;
  res.json(await service.deleteCvFile(studentId));
}));

// SKS Conversions
app.get('/api/sks', asyncRoute(async (req, res) => res.json(await service.getSksConversions())));
app.post('/api/sks/convert', asyncRoute(async (req, res) => res.json(await service.convertSks(req.body.studentId, req.body.sks))));
app.delete('/api/sks/convert/:studentId', asyncRoute(async (req, res) => res.json(await service.deleteSksConversion(req.params.studentId))));

// Evaluations
app.get('/api/evaluations/candidates', asyncRoute(async (req, res) => res.json(await service.getEvaluationCandidates())));
app.get('/api/evaluations', asyncRoute(async (req, res) => res.json(await service.getEvaluations())));
app.get('/api/evaluations/:candidateId', asyncRoute(async (req, res) => res.json(await service.getEvaluation(req.params.candidateId))));
app.post('/api/evaluations', asyncRoute(async (req, res) => res.json(await service.saveEvaluation(req.body))));

// CV Management
app.post('/api/cv/upload', asyncRoute(async (req, res) => {
  const userId = getUserId(req);
  res.json(await service.saveCvFile(userId, req.body.filePath, req.body.fileType));
}));
app.get('/api/cv/:studentId', asyncRoute(async (req, res) => {
  const studentId = req.params.studentId === 'me' ? getUserId(req) : req.params.studentId;
  const file = await service.getCvFile(studentId);
  const details = await service.getCvDetails(studentId);
  res.json({ success: true, file, details });
}));
app.put('/api/cv/:studentId', asyncRoute(async (req, res) => {
  const studentId = req.params.studentId === 'me' ? getUserId(req) : req.params.studentId;
  res.json(await service.saveCvDetails(studentId, req.body));
}));
app.delete('/api/cv/:studentId/file', asyncRoute(async (req, res) => {
  const studentId = req.params.studentId === 'me' ? getUserId(req) : req.params.studentId;
  res.json(await service.deleteCvFile(studentId));
}));

// Vacancy Requirements
app.get('/api/vacancies/:id/requirements', asyncRoute(async (req, res) => {
  res.json(await service.getVacancyRequirements(req.params.id));
}));
// Note: POST /api/vacancies and PUT /api/vacancies/:id should be updated in the frontend to call service.saveVacancyRequirements after creating/updating vacancy.
// I will just add a dedicated endpoint to save requirements for now to keep it modular.
app.post('/api/vacancies/:id/requirements', asyncRoute(async (req, res) => {
  res.json(await service.saveVacancyRequirements(req.params.id, req.body));
}));

// Application Reviews
app.get('/api/applications/:id/cv-reviews', asyncRoute(async (req, res) => {
  res.json(await service.getApplicationReviews(req.params.id));
}));
app.post('/api/applications/:id/review-cv', asyncRoute(async (req, res) => {
  res.json(await service.saveApplicationReview(req.params.id, req.body.reviewerType, req.body));
}));

// Activities
app.get('/api/activities', asyncRoute(async (req, res) => res.json(await service.getRecentActivities())));

// Error handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Express 5: app.listen() returns a Promise, not a Server.
// Must await it to keep the process alive.
(async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log('Successfully connected to MySQL database.');
  } catch (error) {
    console.warn('\n⚠️  WARNING: Failed to connect to MySQL database.');
    console.warn(`Error details: ${error.message}`);
    console.warn('Continuing with MySQL service anyway for audit purposes.\n');
  }

  await app.listen(PORT);
  console.log(`SIMAG API Server is running on http://localhost:${PORT}`);
})();
