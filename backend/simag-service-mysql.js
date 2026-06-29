const pool = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'simag-super-secret-key-2026';

function makeId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000).toString(16)}`;
}

function safeJson(value, fallback = []) {
  if (value == null || value === '') return fallback;
  if (Array.isArray(value) || typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function linesToArray(value) {
  if (Array.isArray(value)) return value;
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

function mapVacancy(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    companyId: row.company_id,
    company: row.company_name || row.company ? {
      id: row.company_id,
      name: row.company_name || row.company,
      email: row.company_email || '',
      location: row.company_location || row.location || ''
    } : null,
    location: row.location,
    workModel: row.work_model,
    quota: Number(row.quota || 0),
    deadline: row.deadline,
    description: row.description || '',
    qualifications: safeJson(row.qualifications),
    responsibilities: safeJson(row.responsibilities),
    status: row.status,
    badge: row.badge,
    createdAt: row.created_at
  };
}

function mapApplicant(row) {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id,
    vacancyId: row.vacancy_id,
    name: row.name,
    nim: row.nim,
    studyProgram: row.study_program,
    semester: row.semester,
    gpa: row.gpa,
    skills: safeJson(row.skills),
    status: row.status,
    cvFileId: row.cv_file_id,
    cvDetailsId: row.cv_details_id,
    createdAt: row.created_at,
    applicationId: row.application_id, // Added to link to applications
    cvFile: row.cv_file_path ? { path: row.cv_file_path, type: row.cv_file_type } : null,
    cvDetails: row.cv_work_experience ? {
      workExperience: safeJson(row.cv_work_experience),
      skills: safeJson(row.cv_skills),
      portfolioLinks: safeJson(row.cv_portfolio_links)
    } : null,
    mitraReview: row.mitra_review_status ? { status: row.mitra_review_status, feedback: row.mitra_review_feedback } : null,
    adminReview: row.admin_review_status ? { status: row.admin_review_status, feedback: row.admin_review_feedback } : null
  };
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.linked_id,
    rawId: row.id,
    linkedId: row.linked_id,
    name: row.name,
    identifier: row.identifier,
    role: row.role
  };
}

function mapIntern(row) {
  if (!row) return null;
  return {
    id: row.id,
    initials: row.initials,
    name: row.name,
    nim: row.nim,
    institution: row.institution,
    studyProgram: row.study_program,
    companyId: row.company_id,
    company: row.company_name || row.company ? {
      id: row.company_id,
      name: row.company_name || row.company
    } : null,
    lecturerId: row.lecturer_id,
    lecturer: row.lecturer_name || row.lecturer ? {
      id: row.lecturer_id,
      name: row.lecturer_name || row.lecturer
    } : null,
    position: row.position,
    status: row.status,
    progress: Number(row.progress || 0),
    logbookCompleted: Number(row.logbook_completed || 0),
    logbookTarget: Number(row.logbook_target || 150),
    period: row.period,
    startDate: row.start_date,
    endDate: row.end_date,
    mentor: row.mentor,
    attendance: row.attendance,
    logbookWeek: row.logbook_week,
    createdAt: row.created_at
  };
}

function mapLogbook(row) {
  if (!row) return null;
  return {
    id: row.id,
    internId: row.intern_id,
    intern: row.intern_name || row.name ? {
      id: row.intern_id,
      name: row.intern_name || row.name,
      nim: row.intern_nim || row.nim || '-',
      company: row.intern_company || row.company || ''
    } : null,
    week: row.week,
    date: row.date,
    timeIn: row.time_in,
    timeOut: row.time_out,
    title: row.title,
    activity: row.activity,
    description: row.description,
    result: row.result,
    obstacle: row.obstacle,
    status: row.status,
    note: row.note,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewer: row.reviewer_name || row.reviewer ? {
      name: row.reviewer_name || row.reviewer
    } : null
  };
}

function mapApplication(row) {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id,
    student: row.student_name || row.name ? {
      id: row.student_id,
      name: row.student_name || row.name,
      nim: row.student_nim || row.nim || '-',
      studyProgram: row.student_study_program || row.study_program || 'S1 Informatika'
    } : null,
    vacancyId: row.vacancy_id,
    vacancy: row.vacancy_title || row.position ? {
      id: row.vacancy_id,
      title: row.vacancy_title || row.position,
      location: row.vacancy_location || '',
      workModel: row.vacancy_work_model || 'Hybrid',
      company: row.company_name || row.company || ''
    } : null,
    companyId: row.company_id,
    company: row.company_name || row.company ? {
      id: row.company_id,
      name: row.company_name || row.company
    } : null,
    lecturerId: row.lecturer_id,
    position: row.position,
    adminStatus: row.admin_status,
    partnerStatus: row.partner_status,
    status: row.status,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    // Add flat properties just in case other frontend code depends on it
    name: row.student_name || row.name || '',
    companyName: row.company_name || row.company || ''
  };
}

function mapSks(row) {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id,
    sks: Number(row.sks || 0),
    target: Number(row.target || 20),
    status: row.status,
    convertedAt: row.converted_at
  };
}

function mapEvaluation(row) {
  if (!row) return null;
  const scores = {
    technical: Number(row.technical_score || 0),
    communication: Number(row.communication_score || 0),
    teamwork: Number(row.teamwork_score || 0),
    discipline: Number(row.discipline_score || 0)
  };
  const scoreValues = Object.values(scores).filter(Number.isFinite);
  const finalScore = scoreValues.length
    ? Math.round(scoreValues.reduce((total, score) => total + score, 0) / scoreValues.length)
    : 0;
  return {
    id: row.id,
    candidateId: row.candidate_id,
    candidate: row.candidate_name || row.name ? {
      id: row.candidate_id,
      name: row.candidate_name || row.name,
      nim: row.candidate_nim || row.nim || '-'
    } : null,
    status: row.status,
    grade: row.grade || gradeFromScore(finalScore),
    scores: {
      ...scores,
      initiative: Number(row.initiative_score || 0)
    },
    finalScore,
    notes: row.notes,
    createdAt: row.created_at
  };
}

function mapActivity(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    meta: row.meta,
    icon: row.icon,
    at: row.created_at,
    createdAt: row.created_at
  };
}

function gradeFromScore(score) {
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  return 'C';
}

function initialsFromName(name, fallback = 'NA') {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || fallback;
}

async function getPrimaryCompany() {
  const [rows] = await pool.query(
    "SELECT linked_id, name, identifier FROM users WHERE role = 'mitra' ORDER BY created_at ASC LIMIT 1"
  );
  const company = rows[0];
  return {
    id: company?.linked_id || 'company-default',
    name: company?.name || 'Perusahaan Mitra',
    email: company?.identifier || '',
    shortName: (company?.name || 'Mitra').replace(' (Persero) Tbk', '')
  };
}

async function addActivity({ type, title, meta, icon }) {
  await pool.query(
    'INSERT INTO activities (id, type, title, meta, icon) VALUES (?, ?, ?, ?, ?)',
    [makeId(type || 'activity'), type, title, meta, icon]
  );
}



async function login({ identifier, password, role }) {
  const normalizedRole = String(role || '').toLowerCase();
  
  // if role is passed, check it. If not, just search by identifier
  let query = 'SELECT * FROM users WHERE identifier = ?';
  let params = [identifier];
  if (role) {
    query += ' AND role = ?';
    params.push(normalizedRole);
  }

  const [rows] = await pool.query(query, params);
  if (rows.length > 0) {
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch || password === user.password) {
      const token = jwt.sign({ id: user.linked_id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
      return {
        success: true,
        message: 'Login berhasil',
        token: token,
        role: user.role,
        user: { id: user.linked_id, name: user.name, identifier: user.identifier, role: user.role }
      };
    }
  }
  return { success: false, message: 'Kredensial tidak valid.' };
}

async function register({ fullname, name, identifier, password, role }) {
  const normalizedRole = String(role || '').toLowerCase();
  const displayName = fullname || name || identifier;
  
  // Validation
  if (!identifier || identifier.length > 50) return { success: false, message: 'Identifier tidak valid atau terlalu panjang.' };
  if (!password || password.length < 6) return { success: false, message: 'Password minimal 6 karakter.' };
  if (!displayName || displayName.length > 100) return { success: false, message: 'Nama terlalu panjang.' };
  
  // Basic XSS check
  if (/<script|on\w+\s*=|javascript:|data:text\/html/i.test(displayName) || /<script|on\w+\s*=|javascript:/i.test(identifier)) {
    return { success: false, message: 'Karakter tidak diizinkan pada input.' };
  }

  const linkedId = makeId(normalizedRole);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = makeId('user');
    await pool.query(
      'INSERT INTO users (id, role, identifier, password, name, linked_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, normalizedRole, identifier, hashedPassword, displayName, linkedId]
    );

    const token = jwt.sign({ id: linkedId, role: normalizedRole }, JWT_SECRET, { expiresIn: '8h' });
    return {
      success: true,
      message: 'Pendaftaran berhasil.',
      token: token,
      user: { id: linkedId, name: displayName, identifier, role: normalizedRole }
    };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return { success: false, message: 'Akun sudah terdaftar.' };
    }
    throw err;
  }
}

// ==========================================
// DATA RECONSTRUCTION FOR FRONTEND
// ==========================================
async function getData() {
  const [
    [users],
    [internRows],
    [vacancies],
    [applications],
    [applicants],
    [logbooks],
    [sksConversions],
    [evaluations],
    [activities]
  ] = await Promise.all([
    pool.query('SELECT * FROM users'),
    pool.query('SELECT * FROM interns ORDER BY created_at DESC'),
    pool.query('SELECT * FROM vacancies ORDER BY created_at DESC'),
    pool.query('SELECT * FROM applications ORDER BY submitted_at DESC'),
    pool.query('SELECT * FROM applicants ORDER BY created_at DESC'),
    pool.query('SELECT * FROM logbooks ORDER BY date DESC, submitted_at DESC'),
    pool.query('SELECT * FROM sks_conversions ORDER BY converted_at DESC'),
    pool.query('SELECT * FROM evaluations ORDER BY created_at DESC'),
    pool.query('SELECT * FROM activities ORDER BY created_at DESC')
  ]);

  const mappedUsers = users.map(mapUser);
  const mappedInterns = internRows.map(mapIntern);

  return {
    users: mappedUsers,
    interns: mappedInterns,
    logbooks: logbooks.map(mapLogbook),
    vacancies: vacancies.map(mapVacancy),
    applications: applications.map(mapApplication),
    applicants: applicants.map(mapApplicant),
    evaluations: evaluations.map(mapEvaluation),
    sksConversions: sksConversions.map(mapSks),
    activities: activities.map(mapActivity),
    companies: mappedUsers.filter(u => u.role === 'mitra').map(u => ({ id: u.id, name: u.name }))
  };
}

async function getDashboardSummary(userId) {
  const data = await getData();
  const user = userId
    ? data.users.find((item) => item.id === userId || item.linkedId === userId || item.rawId === userId)
    : null;
  const studentId = user?.role === 'mahasiswa' ? user.id : null;
  const intern = data.interns.find((item) => item.id === studentId) || null;

  if (!intern) {
    return {
      student: user?.role === 'mahasiswa'
        ? { id: user.id, name: user.name, nim: user.identifier, initials: initialsFromName(user.name, 'MD'), studyProgram: 'S1 Informatika' }
        : null,
      intern: null,
      company: null,
      lecturer: null,
      logbooks: [],
      submittedLogbooks: [],
      revisionLogbooks: [],
      evaluation: null,
      sks: { sks: 0, target: 20, status: 'Pending' },
      application: null
    };
  }

  const logbooks = data.logbooks.filter((item) => item.internId === intern.id);
  const submittedLogbooks = logbooks.filter((item) => ['submitted', 'pending'].includes(item.status));
  const revisionLogbooks = logbooks.filter((item) => item.status === 'revision');
  const evaluation = data.evaluations.find((item) => item.candidateId === intern.id) || null;
  const sks = data.sksConversions.find((item) => item.studentId === intern.id) || { sks: 0, target: 20, status: 'Pending' };
  const application = data.applications.find((item) => item.studentId === intern.id) || null;

  return {
    student: {
      id: intern.id,
      name: intern.name || user?.name || '',
      nim: intern.nim || user?.identifier || '',
      studyProgram: intern.studyProgram || 'S1 Informatika',
      initials: intern.initials || initialsFromName(intern.name || user?.name)
    },
    intern,
    company: intern.company && intern.company.name ? { id: intern.companyId || intern.company.id, name: intern.company.name } : null,
    lecturer: intern.lecturer && intern.lecturer.name ? { id: intern.lecturerId || intern.lecturer.id, name: intern.lecturer.name } : null,
    logbooks,
    submittedLogbooks,
    revisionLogbooks,
    evaluation,
    sks,
    application
  };
}

async function getDashboardSummaryAdmin() {
  const [[{ count: activeStudents }]] = await pool.query('SELECT COUNT(*) as count FROM interns');
  const [[{ count: pendingApplications }]] = await pool.query('SELECT COUNT(*) as count FROM applications WHERE admin_status = "Pending"');
  const [[{ sum: totalSks }]] = await pool.query('SELECT SUM(sks) as sum FROM sks_conversions');
  const [[{ count: pendingSks }]] = await pool.query('SELECT COUNT(*) as count FROM interns i LEFT JOIN sks_conversions s ON i.id = s.student_id WHERE s.id IS NULL OR s.status != "Completed"');
  const [[{ count: companyCount }]] = await pool.query('SELECT COUNT(DISTINCT id) as count FROM users WHERE role="mitra"');
  const [[{ avg: scoreAverage }]] = await pool.query('SELECT ROUND(AVG(technical_score + communication_score + teamwork_score + discipline_score)/4) as avg FROM evaluations');
  const [[{ count: reviewLogbookCount }]] = await pool.query('SELECT COUNT(*) as count FROM logbooks WHERE status IN ("submitted", "pending", "revision")');
  const [[{ count: waitingEval }]] = await pool.query('SELECT COUNT(*) as count FROM interns i LEFT JOIN evaluations e ON i.id = e.candidate_id WHERE e.id IS NULL');
  const [[{ count: activeVacancyCount }]] = await pool.query('SELECT COUNT(*) as count FROM vacancies WHERE status = "active"');
  const [[{ count: totalApplications }]] = await pool.query('SELECT COUNT(*) as count FROM applications');
  const [[{ count: totalLogbooks }]] = await pool.query('SELECT COUNT(*) as count FROM logbooks');

  const [pendingApps] = await pool.query(
    `SELECT a.*, v.title, u.name as companyName, s.name as name 
     FROM applications a 
     LEFT JOIN vacancies v ON a.vacancy_id = v.id 
     LEFT JOIN users u ON a.company_id = u.linked_id 
     LEFT JOIN users s ON a.student_id = s.linked_id 
     WHERE a.admin_status = "Pending" 
     ORDER BY a.submitted_at DESC`
  );

  const pendingMapped = pendingApps.map(mapApplication);


  const [activities] = await pool.query('SELECT * FROM activities ORDER BY created_at DESC LIMIT 12');

  const primarySks = { sks: 0, target: 20, status: 'Pending' };
  const primaryInternProgress = 0;

  return {
    pendingApplications: pendingMapped,
    pendingSks: pendingSks || 0,
    activities,
    stats: { 
      activeStudents: activeStudents || 0, 
      companyCount: companyCount || 0, 
      totalSks: Number(totalSks || 0), 
      scoreAverage: Number(scoreAverage || 0) 
    },
    connectionSummary: `${totalApplications} pendaftaran - ${totalLogbooks} logbook`,
    primarySks: primarySks,
    primaryInternProgress: primaryInternProgress,
    reviewLogbookCount: reviewLogbookCount || 0,
    waitingEval: waitingEval || 0,
    activeVacancyCount: activeVacancyCount || 0,
    internCount: activeStudents || 0,
    pendingApprovalCount: pendingApplications || 0
  };
}

async function getDashboardSummaryDospem(userId) {
  const lecturerId = userId;
  if (!lecturerId) {
    return {
      interns: [],
      reviewLogbooks: [],
      _allLogbooks: [],
      waitingEvaluations: 0,
      averageProgress: 0,
      sksConversions: [],
      primarySks: { sks: 0, target: 20, status: 'Pending' },
      primaryInternStats: { progress: 0, logbookCompleted: 0 },
      activeVacancyCount: 0,
      internCount: 0,
      totalSksConversions: 0
    };
  }

  const [[{ count: internCount }]] = await pool.query('SELECT COUNT(*) as count FROM interns WHERE lecturer_id = ?', [lecturerId]);
  const [[{ count: reviewLogbookCount }]] = await pool.query('SELECT COUNT(*) as count FROM logbooks l JOIN interns i ON l.intern_id = i.id WHERE i.lecturer_id = ? AND l.status IN ("submitted", "pending", "revision")', [lecturerId]);
  const [[{ count: waitingEvaluations }]] = await pool.query('SELECT COUNT(*) as count FROM interns i LEFT JOIN evaluations e ON i.id = e.candidate_id WHERE i.lecturer_id = ? AND e.id IS NULL', [lecturerId]);
  const [[{ avg: averageProgress }]] = await pool.query('SELECT ROUND(AVG(progress)) as avg FROM interns WHERE lecturer_id = ?', [lecturerId]);
  const [[{ count: activeVacancyCount }]] = await pool.query('SELECT COUNT(*) as count FROM vacancies WHERE status = "active"');
  const [[{ count: totalSksConversions }]] = await pool.query('SELECT COUNT(*) as count FROM sks_conversions s JOIN interns i ON s.student_id = i.id WHERE i.lecturer_id = ?', [lecturerId]);

  const [internsRows] = await pool.query('SELECT * FROM interns WHERE lecturer_id = ? ORDER BY created_at DESC LIMIT 5', [lecturerId]);
  const interns = internsRows.map(mapIntern);
  
  const [logbooksRows] = await pool.query('SELECT l.* FROM logbooks l JOIN interns i ON l.intern_id = i.id WHERE i.lecturer_id = ? AND l.status IN ("submitted", "pending", "revision") ORDER BY l.date DESC LIMIT 5', [lecturerId]);
  const reviewLogbooks = logbooksRows.map(mapLogbook);
  
  const [allLogbooksRows] = await pool.query('SELECT l.* FROM logbooks l JOIN interns i ON l.intern_id = i.id WHERE i.lecturer_id = ? ORDER BY l.date DESC LIMIT 5', [lecturerId]);
  const _allLogbooks = allLogbooksRows.map(mapLogbook);
  
  const [sksRows] = await pool.query('SELECT s.* FROM sks_conversions s JOIN interns i ON s.student_id = i.id WHERE i.lecturer_id = ? LIMIT 5', [lecturerId]);
  const sksConversions = sksRows.map(row => ({ id: row.id, studentId: row.student_id, sks: row.sks, target: row.target, status: row.status, convertedAt: row.converted_at }));

  const primarySks = { sks: 0, target: 20, status: 'Pending' };
  const primaryInternStats = { progress: 0, logbookCompleted: 0 };

  return {
    interns,
    reviewLogbooks,
    _allLogbooks,
    waitingEvaluations: waitingEvaluations || 0,
    averageProgress: Number(averageProgress || 0),
    sksConversions,
    primarySks: primarySks,
    primaryInternStats: primaryInternStats,
    activeVacancyCount: activeVacancyCount || 0,
    internCount: internCount || 0,
    totalSksConversions: totalSksConversions || 0
  };
}

async function getDashboardSummaryMitra(userId) {
  const companyId = userId;
  if (!companyId) return { interns: [], vacancies: [], applicants: [], logbooks: [], stats: { internCount: 0, applicantCount: 0, vacancyCount: 0, waitingEval: 0 } };
  const [[{ count: internCount }]] = await pool.query('SELECT COUNT(*) as count FROM interns WHERE company_id = ?', [companyId]);
  const [[{ count: applicantCount }]] = await pool.query('SELECT COUNT(*) as count FROM applicants a JOIN vacancies v ON a.vacancy_id = v.id WHERE v.company_id = ?', [companyId]);
  const [[{ count: vacancyCount }]] = await pool.query('SELECT COUNT(*) as count FROM vacancies WHERE company_id = ? AND status="active"', [companyId]);
  const [[{ count: waitingEval }]] = await pool.query('SELECT COUNT(*) as count FROM interns i LEFT JOIN evaluations e ON i.id = e.candidate_id WHERE i.company_id = ? AND e.id IS NULL', [companyId]);
  
  const [internsRows] = await pool.query('SELECT * FROM interns WHERE company_id = ? LIMIT 5', [companyId]);
  const interns = internsRows.map(mapIntern);
  
  const [vacanciesRows] = await pool.query('SELECT * FROM vacancies WHERE company_id = ? LIMIT 5', [companyId]);
  const vacancies = vacanciesRows.map(mapVacancy);
  
  const [applicantsRows] = await pool.query('SELECT a.* FROM applicants a JOIN vacancies v ON a.vacancy_id = v.id WHERE v.company_id = ? LIMIT 5', [companyId]);
  const applicants = applicantsRows.map(mapApplicant);

  const [logbooksRows] = await pool.query(
    `SELECT l.*, i.name as intern_name, i.nim as intern_nim, i.company as intern_company 
     FROM logbooks l 
     JOIN interns i ON l.intern_id = i.id 
     WHERE i.company_id = ?`,
    [companyId]
  );
  const logbooks = logbooksRows.map(mapLogbook);

  return {
    interns,
    vacancies,
    applicants,
    logbooks,
    stats: {
      internCount: internCount || 0,
      applicantCount: applicantCount || 0,
      vacancyCount: vacancyCount || 0,
      waitingEval: waitingEval || 0
    }
  };
}

// ==========================================
// FULL MYSQL CRUD IMPLEMENTATIONS
// ==========================================

// --- People ---
async function getStudent() {
  const [rows] = await pool.query('SELECT * FROM users WHERE role = ?', ['mahasiswa']);
  if (rows.length === 0) return {};
  const u = rows[0];
  return { id: u.linked_id, name: u.name, identifier: u.identifier, role: u.role };
}

async function getLecturer() {
  const [rows] = await pool.query('SELECT * FROM users WHERE role = ?', ['dospem']);
  if (rows.length === 0) return {};
  const u = rows[0];
  return { id: u.linked_id, name: u.name, identifier: u.identifier, role: u.role };
}

async function getCompany() {
  const [rows] = await pool.query('SELECT * FROM users WHERE role = ?', ['mitra']);
  if (rows.length === 0) return {};
  const u = rows[0];
  return { id: u.linked_id, name: u.name, identifier: u.identifier, role: u.role };
}

async function getCompanyProfile() {
  const company = await getPrimaryCompany();
  return company || {};
}

async function saveCompanyProfile(body) {
  // For now, return the body as-is since company_profile is embedded in users/interns
  return body;
}

async function saveRoleProfile(role, body) {
  const [rows] = await pool.query('SELECT * FROM users WHERE role = ? LIMIT 1', [role]);
  if (rows.length > 0) {
    await pool.query('UPDATE users SET name = ? WHERE id = ?', [body.name || rows[0].name, rows[0].id]);
  }
  return { success: true, message: 'Profil disimpan.' };
}

// --- Interns ---
async function getInterns() {
  const [rows] = await pool.query('SELECT * FROM interns');
  return rows;
}

async function getIntern(id) {
  const [rows] = await pool.query('SELECT * FROM interns WHERE id = ?', [id]);
  return rows[0] || null;
}

// --- Logbooks ---
async function getLogbooks(userId, role) {
  let query = `
    SELECT l.*, i.name as intern_name, i.nim as intern_nim, i.company as intern_company 
    FROM logbooks l
    LEFT JOIN interns i ON l.intern_id = i.id
  `;
  const params = [];
  
  if (role === 'mahasiswa') {
    query += ' WHERE l.intern_id = ?';
    params.push(userId);
  } else if (role === 'mitra') {
    query += ' WHERE i.company_id = ?';
    params.push(userId);
  } else if (role === 'dospem') {
    query += ' WHERE i.lecturer_id = ?';
    params.push(userId);
  } else if (userId && !role) {
    const [userRows] = await pool.query('SELECT role FROM users WHERE linked_id = ?', [userId]);
    if (userRows.length > 0) {
      const userRole = userRows[0].role;
      if (userRole === 'mahasiswa') {
        query += ' WHERE l.intern_id = ?';
        params.push(userId);
      } else if (userRole === 'mitra') {
        query += ' WHERE i.company_id = ?';
        params.push(userId);
      } else if (userRole === 'dospem') {
        query += ' WHERE i.lecturer_id = ?';
        params.push(userId);
      }
    } else {
      query += ' WHERE l.intern_id = ?';
      params.push(userId);
    }
  }
  
  const [rows] = await pool.query(query, params);
  return rows.map(mapLogbook);
}

async function getLogbook(id) {
  const [rows] = await pool.query(`
    SELECT l.*, i.name as intern_name, i.nim as intern_nim, i.company as intern_company 
    FROM logbooks l
    LEFT JOIN interns i ON l.intern_id = i.id
    WHERE l.id = ?
  `, [id]);
  return mapLogbook(rows[0]);
}

async function addLogbook(body, userId) {
  const id = makeId('lb');
  try {
    await pool.query(
      `INSERT INTO logbooks (id, intern_id, week, date, time_in, time_out, title, activity, description, result, obstacle, status, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId || body.internId, body.week || '', body.date || '', body.timeIn || '', body.timeOut || '',
       body.title || '', body.activity || '', body.description || '', body.result || '', body.obstacle || '',
       'pending', new Date().toISOString()]
    );
    await addActivity({ type: 'logbook', title: `Logbook baru: ${body.title || 'Tanpa judul'}`, meta: 'Baru saja', icon: 'LB' });
    return { success: true, id, message: 'Logbook berhasil ditambahkan.' };
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return { success: false, message: 'Intern ID tidak valid atau tidak ditemukan.' };
    }
    throw err;
  }
}

async function updateLogbook(id, changes) {
  const setClauses = [];
  const values = [];
  for (const [key, val] of Object.entries(changes)) {
    const colMap = { title: 'title', activity: 'activity', description: 'description', result: 'result',
      obstacle: 'obstacle', status: 'status', note: 'note', reviewer: 'reviewer', reviewedAt: 'reviewed_at' };
    const col = colMap[key];
    if (col) { setClauses.push(`${col} = ?`); values.push(val); }
  }
  if (setClauses.length === 0) return { success: false, message: 'Nothing to update.' };
  values.push(id);
  await pool.query(`UPDATE logbooks SET ${setClauses.join(', ')} WHERE id = ?`, values);
  return { success: true, message: 'Logbook berhasil diperbarui.' };
}

async function approveLogbook(id) {
  const lecturer = await getLecturer();
  await pool.query(
    'UPDATE logbooks SET status = ?, note = ?, reviewer = ?, reviewed_at = ? WHERE id = ?',
    ['approved', `Disetujui oleh ${lecturer.name || 'Dosen'}.`, lecturer.name || 'Dosen', new Date().toISOString(), id]
  );
  return { success: true, message: 'Logbook disetujui.' };
}

async function requestLogbookRevision(id, note) {
  const lecturer = await getLecturer();
  await pool.query(
    'UPDATE logbooks SET status = ?, note = ?, reviewer = ?, reviewed_at = ? WHERE id = ?',
    ['revision', note || '', lecturer.name || 'Dosen', new Date().toISOString(), id]
  );
  return { success: true, message: 'Revisi diminta.' };
}

async function getLatestLogbookForIntern(internId) {
  const [rows] = await pool.query(
    'SELECT * FROM logbooks WHERE intern_id = ? ORDER BY submitted_at DESC LIMIT 1', [internId]
  );
  return rows[0] || null;
}

async function getPendingLogbookForIntern(internId) {
  const [rows] = await pool.query(
    'SELECT * FROM logbooks WHERE intern_id = ? AND status = ? LIMIT 1', [internId, 'pending']
  );
  return rows[0] || null;
}

// --- Vacancies ---
async function getVacancies() {
  const [rows] = await pool.query(`
    SELECT v.*, u.name as company_name, u.identifier as company_email 
    FROM vacancies v 
    LEFT JOIN users u ON v.company_id = u.linked_id
  `);
  return rows.map(v => ({
    ...mapVacancy(v)
  }));
}

async function getVacancy(id) {
  const [rows] = await pool.query(`
    SELECT v.*, u.name as company_name, u.identifier as company_email 
    FROM vacancies v 
    LEFT JOIN users u ON v.company_id = u.linked_id
    WHERE v.id = ?
  `, [id]);
  if (rows.length === 0) return null;
  return mapVacancy(rows[0]);
}

async function addVacancy(body) {
  const id = makeId('vac');
  const company = await getPrimaryCompany();
  await pool.query(
    `INSERT INTO vacancies (id, title, company_id, company, location, work_model, quota, deadline, description, qualifications, responsibilities, status, badge)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, body.title || '', company?.id || body.companyId || '', company?.name || body.company || '',
     body.location || '', body.workModel || 'Onsite', body.quota || 1, body.deadline || '',
     body.description || '', JSON.stringify(body.qualifications || []),
     JSON.stringify(body.responsibilities || []), 'active', body.badge || 'badge-success']
  );
  
  if (body.requirements) {
    const reqId = makeId('req');
    await pool.query(
      `INSERT INTO vacancy_requirements (id, vacancy_id, min_gpa, required_skills, required_semester)
       VALUES (?, ?, ?, ?, ?)`,
      [reqId, id, body.requirements.minGpa || null, JSON.stringify(body.requirements.specificSkills || []), null]
    );
  }

  await addActivity({ type: 'vacancy', title: `Lowongan baru: ${body.title}`, meta: 'Baru saja', icon: 'LW' });
  return { success: true, id, message: 'Lowongan berhasil ditambahkan.' };
}

async function updateVacancy(id, changes) {
  const setClauses = [];
  const values = [];
  for (const [key, val] of Object.entries(changes)) {
    const colMap = { title: 'title', location: 'location', workModel: 'work_model', quota: 'quota',
      deadline: 'deadline', description: 'description', status: 'status', badge: 'badge' };
    const col = colMap[key];
    if (col) { setClauses.push(`${col} = ?`); values.push(val); }
    if (key === 'qualifications') { setClauses.push('qualifications = ?'); values.push(JSON.stringify(val)); }
    if (key === 'responsibilities') { setClauses.push('responsibilities = ?'); values.push(JSON.stringify(val)); }
  }
  if (setClauses.length === 0) return { success: false, message: 'Nothing to update.' };
  values.push(id);
  await pool.query(`UPDATE vacancies SET ${setClauses.join(', ')} WHERE id = ?`, values);
  return { success: true, message: 'Lowongan berhasil diperbarui.' };
}

// --- Applicants ---
async function getApplicants(vacancyId) {
  let query = `
    SELECT a.*, 
           app.id as application_id,
           cvf.file_path as cv_file_path, cvf.file_type as cv_file_type,
           cvd.work_experience as cv_work_experience, cvd.skills as cv_skills, cvd.portfolio_links as cv_portfolio_links,
           arm.status as mitra_review_status, arm.feedback as mitra_review_feedback,
           ara.status as admin_review_status, ara.feedback as admin_review_feedback
    FROM applicants a
    LEFT JOIN applications app ON a.student_id = app.student_id AND a.vacancy_id = app.vacancy_id
    LEFT JOIN cv_files cvf ON a.cv_file_id = cvf.id
    LEFT JOIN cv_details cvd ON a.cv_details_id = cvd.id
    LEFT JOIN application_reviews arm ON app.id = arm.application_id AND arm.reviewer_type = 'mitra'
    LEFT JOIN application_reviews ara ON app.id = ara.application_id AND ara.reviewer_type = 'admin'
  `;
  if (vacancyId) {
    const [rows] = await pool.query(query + ' WHERE a.vacancy_id = ?', [vacancyId]);
    return rows.map(mapApplicant);
  }
  const [rows] = await pool.query(query);
  return rows.map(mapApplicant);
}

async function getApplicant(id) {
  let query = `
    SELECT a.*, 
           app.id as application_id,
           cvf.file_path as cv_file_path, cvf.file_type as cv_file_type,
           cvd.work_experience as cv_work_experience, cvd.skills as cv_skills, cvd.portfolio_links as cv_portfolio_links,
           arm.status as mitra_review_status, arm.feedback as mitra_review_feedback,
           ara.status as admin_review_status, ara.feedback as admin_review_feedback
    FROM applicants a
    LEFT JOIN applications app ON a.student_id = app.student_id AND a.vacancy_id = app.vacancy_id
    LEFT JOIN cv_files cvf ON a.cv_file_id = cvf.id
    LEFT JOIN cv_details cvd ON a.cv_details_id = cvd.id
    LEFT JOIN application_reviews arm ON app.id = arm.application_id AND arm.reviewer_type = 'mitra'
    LEFT JOIN application_reviews ara ON app.id = ara.application_id AND ara.reviewer_type = 'admin'
    WHERE a.id = ?
  `;
  const [rows] = await pool.query(query, [id]);
  if (rows.length === 0) return null;
  return mapApplicant(rows[0]);
}

async function updateApplicant(id, changes) {
  const setClauses = [];
  const values = [];
  for (const [key, val] of Object.entries(changes)) {
    const colMap = { status: 'status', name: 'name', nim: 'nim', studyProgram: 'study_program',
      semester: 'semester', gpa: 'gpa' };
    const col = colMap[key];
    if (col) { setClauses.push(`${col} = ?`); values.push(val); }
    if (key === 'skills') { setClauses.push('skills = ?'); values.push(JSON.stringify(val)); }
  }
  if (setClauses.length === 0) return { success: false, message: 'Nothing to update.' };
  values.push(id);
  await pool.query(`UPDATE applicants SET ${setClauses.join(', ')} WHERE id = ?`, values);

  // If status is updated to Diterima, sync with applications and interns
  if (changes.status === 'Diterima' || changes.status === 'Accepted') {
    const [applicantRows] = await pool.query('SELECT * FROM applicants WHERE id = ?', [id]);
    const applicant = applicantRows[0];
    if (applicant) {
      const [vacRows] = await pool.query('SELECT company FROM vacancies WHERE id = ?', [applicant.vacancy_id]);
      const companyName = vacRows[0]?.company || 'Mitra';

      await addActivity({
        type: 'application',
        title: `Lamaran ${applicant.name} diterima oleh ${companyName}`,
        meta: `Oleh ${companyName}`,
        icon: 'AC'
      });

      const [appRows] = await pool.query('SELECT * FROM applications WHERE student_id = ? AND vacancy_id = ?', [applicant.student_id, applicant.vacancy_id]);
      const application = appRows[0];
      if (application) {
        const isAdminApproved = ['approved', 'Approved'].includes(application.admin_status);
        const newOverallStatus = isAdminApproved ? 'Accepted' : 'Pending';
        await pool.query(
          "UPDATE applications SET partner_status = 'Accepted', status = ? WHERE id = ?",
          [newOverallStatus, application.id]
        );
        if (isAdminApproved) {
          await syncApplicationAndIntern(applicant.student_id, applicant.vacancy_id, application);
        }
      }
    }
  } else if (changes.status === 'Ditolak' || changes.status === 'Rejected') {
    const [applicantRows] = await pool.query('SELECT * FROM applicants WHERE id = ?', [id]);
    const applicant = applicantRows[0];
    if (applicant) {
      const [vacRows] = await pool.query('SELECT company FROM vacancies WHERE id = ?', [applicant.vacancy_id]);
      const companyName = vacRows[0]?.company || 'Mitra';

      await addActivity({
        type: 'application',
        title: `Lamaran ${applicant.name} ditolak oleh ${companyName}`,
        meta: `Oleh ${companyName}`,
        icon: 'RJ'
      });

      const [appRows] = await pool.query('SELECT * FROM applications WHERE student_id = ? AND vacancy_id = ?', [applicant.student_id, applicant.vacancy_id]);
      const application = appRows[0];
      if (application) {
        await pool.query(
          "UPDATE applications SET partner_status = 'Rejected', status = 'Rejected' WHERE id = ?",
          [application.id]
        );
      }
    }
  }

  return { success: true, message: 'Pelamar berhasil diperbarui.' };
}

// --- Applications ---
async function getApplications() {
  const [rows] = await pool.query(`
    SELECT a.*, 
           s.name as student_name, s.identifier as student_nim,
           v.title as vacancy_title, v.location as vacancy_location, v.work_model as vacancy_work_model, 
           u.name as company_name,
           arm.status as mitra_review_status, arm.feedback as mitra_review_feedback
    FROM applications a
    LEFT JOIN users s ON a.student_id = s.linked_id
    LEFT JOIN vacancies v ON a.vacancy_id = v.id
    LEFT JOIN users u ON a.company_id = u.linked_id
    LEFT JOIN application_reviews arm ON a.id = arm.application_id AND arm.reviewer_type = 'mitra'
  `);
  return rows.map(row => {
    const mapped = mapApplication(row);
    if (row.mitra_review_status) {
      mapped.mitraReview = { status: row.mitra_review_status, feedback: row.mitra_review_feedback };
    }
    return mapped;
  });
}

async function applyVacancy(vacancyId, userId, cvFileId, cvDetailsId) {
  const id = makeId('apply');
  const applicantId = makeId('applicant');
  try {
    const [users] = await pool.query('SELECT name, identifier FROM users WHERE linked_id = ?', [userId]);
    const user = users[0] || { name: 'Student', identifier: '-' };

    // CHECK 1: Prevent duplicate application to same vacancy
    const [existingApps] = await pool.query(
      `SELECT id FROM applications WHERE student_id = ? AND vacancy_id = ? AND status NOT IN ('rejected', 'Ditolak')`,
      [userId, vacancyId]
    );
    if (existingApps.length > 0) {
      return { success: false, message: 'Kamu sudah melamar posisi ini. Cek status lamaran di dashboard.' };
    }

    // CHECK 2: Prevent apply if already interning at the same company
    const [vacancy] = await pool.query('SELECT company_id FROM vacancies WHERE id = ?', [vacancyId]);
    if (vacancy.length > 0) {
      const [internships] = await pool.query(
        `SELECT id FROM interns WHERE nim = ? AND company_id = ? AND status NOT IN ('Selesai', 'Ditolak')`,
        [user.identifier, vacancy[0].company_id]
      );
      if (internships.length > 0) {
        return { 
          success: false, 
          message: 'Kamu sudah magang di perusahaan ini. Silakan tunggu magang kamu selesai atau hubungi admin.' 
        };
      }
    }

    // Find student's cv_files and cv_details if not provided
    let finalCvFileId = cvFileId;
    let finalCvDetailsId = cvDetailsId;
    
    if (!finalCvFileId) {
      const [cvf] = await pool.query('SELECT id FROM cv_files WHERE user_id = ?', [userId]);
      if (cvf.length > 0) finalCvFileId = cvf[0].id;
    }
    if (!finalCvDetailsId) {
      const [cvd] = await pool.query('SELECT id FROM cv_details WHERE user_id = ?', [userId]);
      if (cvd.length > 0) finalCvDetailsId = cvd[0].id;
    }

    await pool.query(
      `INSERT INTO applications (id, student_id, vacancy_id, status, submitted_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, userId, vacancyId, 'pending', new Date().toISOString()]
    );

    await pool.query(
      `INSERT INTO applicants (id, student_id, vacancy_id, name, nim, study_program, semester, gpa, status, cv_file_id, cv_details_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [applicantId, userId, vacancyId, user.name, user.identifier, 'S1 Informatika', 6, '-', 'Menunggu', finalCvFileId || null, finalCvDetailsId || null]
    );

    await addActivity({ type: 'application', title: `Lamaran ${user.name} baru diajukan`, meta: 'Baru saja', icon: 'AP' });
    return { success: true, id, message: 'Lamaran berhasil diajukan.' };
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return { success: false, message: 'Vacancy ID tidak valid atau tidak ditemukan.' };
    }
    throw err;
  }
}

async function syncApplicationAndIntern(studentId, vacancyId, application) {
  // Get student profile
  const [userRows] = await pool.query('SELECT * FROM users WHERE linked_id = ?', [studentId]);
  const user = userRows[0] || { name: 'Student', identifier: '-' };

  // Get vacancy details
  const [vacRows] = await pool.query('SELECT * FROM vacancies WHERE id = ?', [vacancyId]);
  const vacancy = vacRows[0];
  if (!vacancy) return;

  // Get lecturer details
  const lecturerId = application.lecturer_id || 'dospem-demo';
  const [lectRows] = await pool.query('SELECT name FROM users WHERE linked_id = ?', [lecturerId]);
  const lecturerName = lectRows[0]?.name || 'Dosen Pembimbing Demo';

  // Check if student is already in interns table
  const [internRows] = await pool.query('SELECT * FROM interns WHERE id = ?', [studentId]);

  if (internRows.length > 0) {
    await pool.query(
      `UPDATE interns 
       SET status = 'Aktif', company_id = ?, company = ?, lecturer_id = ?, lecturer = ?, position = ? 
       WHERE id = ?`,
      [vacancy.company_id, vacancy.company, lecturerId, lecturerName, vacancy.title, studentId]
    );
  } else {
    // Insert new intern
    const name = user.name || 'Student';
    const initials = name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || 'MD';
    const nim = user.identifier || '-';
    const studyProgram = 'S1 Informatika';
    const period = 'Juni - Desember 2026';
    const startDate = '2026-06-15';
    const endDate = '2026-12-15';
    const mentor = 'Mentor Demo';

    await pool.query(
      `INSERT INTO interns (id, initials, name, nim, institution, study_program, company_id, company, lecturer_id, lecturer, position, status, progress, logbook_completed, logbook_target, period, start_date, end_date, mentor, attendance, logbook_week)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        initials,
        name,
        nim,
        'Universitas Amikom Yogyakarta',
        studyProgram,
        vacancy.company_id,
        vacancy.company,
        lecturerId,
        lecturerName,
        vacancy.title,
        'Aktif',
        0,
        0,
        150,
        period,
        startDate,
        endDate,
        mentor,
        '96%',
        'Minggu ke-1'
      ]
    );
  }
}

async function approveApplication(id) {
  const [appRows] = await pool.query('SELECT * FROM applications WHERE id = ?', [id]);
  const application = appRows[0];
  if (!application) return { success: false, message: 'Lamaran tidak ditemukan.' };

  const [userRows] = await pool.query('SELECT name FROM users WHERE linked_id = ?', [application.student_id]);
  const userName = userRows[0]?.name || 'Student';

  await addActivity({
    type: 'application',
    title: `Lamaran ${userName} disetujui oleh Admin Prodi`,
    meta: 'Oleh Admin Prodi',
    icon: 'AP'
  });

  const isPartnerAccepted = application.partner_status === 'Accepted';
  const newOverallStatus = isPartnerAccepted ? 'Accepted' : 'Approved';
  await pool.query(
    'UPDATE applications SET admin_status = ?, status = ?, approved_at = ? WHERE id = ?',
    ['Approved', newOverallStatus, new Date().toISOString(), id]
  );

  if (isPartnerAccepted) {
    await syncApplicationAndIntern(application.student_id, application.vacancy_id, application);
  }

  return { success: true, message: 'Lamaran disetujui.' };
}

// --- SKS Conversions ---
async function getSksConversions() {
  const [rows] = await pool.query('SELECT * FROM sks_conversions');
  return rows.map(mapSks);
}

async function convertSks(studentId, sks) {
  const [existing] = await pool.query('SELECT id FROM sks_conversions WHERE student_id = ?', [studentId]);
  let id;
  if (existing.length > 0) {
    id = existing[0].id;
    await pool.query(
      "UPDATE sks_conversions SET sks = ?, target = 20, status = 'Completed', converted_at = ? WHERE id = ?",
      [sks, new Date().toISOString(), id]
    );
  } else {
    id = makeId('sks');
    await pool.query(
      "INSERT INTO sks_conversions (id, student_id, sks, target, status, converted_at) VALUES (?, ?, ?, 20, 'Completed', ?)",
      [id, studentId, sks, new Date().toISOString()]
    );
  }
  const [userRows] = await pool.query('SELECT name FROM users WHERE linked_id = ?', [studentId]);
  const userName = userRows[0]?.name || 'Mahasiswa';
  await addActivity({
    type: 'sks',
    title: `Konversi SKS ${userName} selesai`,
    meta: `${sks} SKS dikonversi`,
    icon: 'SK'
  });
  return { success: true, id, message: 'Konversi SKS berhasil.' };
}

async function deleteSksConversion(studentId) {
  await pool.query('DELETE FROM sks_conversions WHERE student_id = ?', [studentId]);
  return { success: true, message: 'Konversi SKS dihapus.' };
}

// --- Evaluations ---
async function getEvaluations() {
  const [rows] = await pool.query(`
    SELECT e.*, 
           COALESCE(i.name, u.name) as candidate_name, 
           COALESCE(i.nim, u.identifier) as candidate_nim 
    FROM evaluations e
    LEFT JOIN interns i ON e.candidate_id = i.id
    LEFT JOIN users u ON e.candidate_id = u.linked_id
  `);
  return rows.map(mapEvaluation);
}

async function getEvaluation(candidateId) {
  const [rows] = await pool.query(`
    SELECT e.*, 
           COALESCE(i.name, u.name) as candidate_name, 
           COALESCE(i.nim, u.identifier) as candidate_nim 
    FROM evaluations e
    LEFT JOIN interns i ON e.candidate_id = i.id
    LEFT JOIN users u ON e.candidate_id = u.linked_id
    WHERE e.candidate_id = ?
  `, [candidateId]);
  return mapEvaluation(rows[0]);
}

async function getEvaluationCandidates() {
  const [rows] = await pool.query(
    `SELECT i.id, i.name, i.nim, i.company, i.position, i.status, i.progress, i.logbook_completed, i.logbook_target
     FROM interns i
     WHERE i.status IN ('active', 'Aktif', 'Menunggu Evaluasi')
     ORDER BY i.name`
  );
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    nim: r.nim,
    company: r.company,
    position: r.position,
    status: r.status,
    progress: r.progress,
    logbookCompleted: r.logbook_completed,
    logbookTarget: r.logbook_target
  }));
}

async function saveEvaluation(body) {
  const id = makeId('eval');
  const scoresObj = body.scores || {};
  const technical = scoresObj.technical !== undefined ? Number(scoresObj.technical) : Number(body.technicalScore || body.technical_score || 0);
  const communication = scoresObj.communication !== undefined ? Number(scoresObj.communication) : Number(body.communicationScore || body.communication_score || 0);
  const teamwork = scoresObj.teamwork !== undefined ? Number(scoresObj.teamwork) : Number(body.teamworkScore || body.teamwork_score || 0);
  const discipline = scoresObj.discipline !== undefined ? Number(scoresObj.discipline) : Number(body.disciplineScore || body.discipline_score || 0);
  const initiative = scoresObj.initiative !== undefined ? Number(scoresObj.initiative) : Number(body.initiativeScore || body.initiative_score || 0);

  // Calculate overall grade based on 4 criteria average
  const finalScore = Math.round((technical + communication + teamwork + discipline) / 4);
  const grade = body.grade || gradeFromScore(finalScore);

  await pool.query(
    `INSERT INTO evaluations (id, candidate_id, status, grade, technical_score, communication_score, teamwork_score, discipline_score, initiative_score, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       status = VALUES(status), grade = VALUES(grade),
       technical_score = VALUES(technical_score), communication_score = VALUES(communication_score),
       teamwork_score = VALUES(teamwork_score), discipline_score = VALUES(discipline_score),
       initiative_score = VALUES(initiative_score), notes = VALUES(notes)`,
    [id, body.candidateId, body.status || 'completed', grade,
     technical, communication, teamwork, discipline, initiative,
     body.notes || body.feedback || '']
  );
  const [internRows] = await pool.query('SELECT name FROM interns WHERE id = ?', [body.candidateId]);
  const candidateName = internRows[0]?.name || 'Mahasiswa';
  await addActivity({
    type: 'evaluation',
    title: `Evaluasi penilaian magang ${candidateName} dikirim`,
    meta: `Grade: ${grade}`,
    icon: 'EV'
  });
  return { success: true, id, message: 'Evaluasi berhasil disimpan.' };
}

// --- Activities ---
async function getRecentActivities() {
  const [rows] = await pool.query('SELECT * FROM activities ORDER BY created_at DESC LIMIT 12');
  return rows.map(mapActivity);
}

// --- CV Management ---
async function saveCvFile(userId, filePath, fileType) {
  const id = makeId('cvf');
  const [existing] = await pool.query('SELECT id FROM cv_files WHERE user_id = ?', [userId]);
  if (existing.length > 0) {
    await pool.query(
      'UPDATE cv_files SET file_path = ?, file_type = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [filePath, fileType, userId]
    );
    return { success: true, message: 'CV File updated.' };
  } else {
    await pool.query(
      'INSERT INTO cv_files (id, user_id, file_path, file_type) VALUES (?, ?, ?, ?)',
      [id, userId, filePath, fileType]
    );
    return { success: true, id, message: 'CV File uploaded.' };
  }
}

async function getCvFile(userId) {
  const [rows] = await pool.query('SELECT * FROM cv_files WHERE user_id = ?', [userId]);
  return rows[0] || null;
}

async function deleteCvFile(userId) {
  await pool.query('DELETE FROM cv_files WHERE user_id = ?', [userId]);
  return { success: true, message: 'CV File deleted.' };
}

async function saveCvDetails(userId, details) {
  const id = makeId('cvd');
  const [existing] = await pool.query('SELECT id FROM cv_details WHERE user_id = ?', [userId]);
  if (existing.length > 0) {
    await pool.query(
      'UPDATE cv_details SET work_experience = ?, skills = ?, portfolio_links = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [JSON.stringify(details.workExperience || []), JSON.stringify(details.skills || []), JSON.stringify(details.portfolioLinks || []), userId]
    );
    return { success: true, message: 'CV Details updated.' };
  } else {
    await pool.query(
      'INSERT INTO cv_details (id, user_id, work_experience, skills, portfolio_links) VALUES (?, ?, ?, ?, ?)',
      [id, userId, JSON.stringify(details.workExperience || []), JSON.stringify(details.skills || []), JSON.stringify(details.portfolioLinks || [])]
    );
    return { success: true, id, message: 'CV Details saved.' };
  }
}

async function getCvDetails(userId) {
  const [rows] = await pool.query('SELECT * FROM cv_details WHERE user_id = ?', [userId]);
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    workExperience: safeJson(row.work_experience),
    skills: safeJson(row.skills),
    portfolioLinks: safeJson(row.portfolio_links),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// --- Vacancy Requirements ---
async function saveVacancyRequirements(vacancyId, requirements) {
  const id = makeId('vreq');
  const [existing] = await pool.query('SELECT id FROM vacancy_requirements WHERE vacancy_id = ?', [vacancyId]);
  if (existing.length > 0) {
    await pool.query(
      'UPDATE vacancy_requirements SET min_gpa = ?, required_skills = ?, required_semester = ?, custom_questions = ?, updated_at = CURRENT_TIMESTAMP WHERE vacancy_id = ?',
      [requirements.minGpa || '', JSON.stringify(requirements.requiredSkills || []), requirements.requiredSemester || 0, JSON.stringify(requirements.customQuestions || []), vacancyId]
    );
    return { success: true, message: 'Vacancy Requirements updated.' };
  } else {
    await pool.query(
      'INSERT INTO vacancy_requirements (id, vacancy_id, min_gpa, required_skills, required_semester, custom_questions) VALUES (?, ?, ?, ?, ?, ?)',
      [id, vacancyId, requirements.minGpa || '', JSON.stringify(requirements.requiredSkills || []), requirements.requiredSemester || 0, JSON.stringify(requirements.customQuestions || [])]
    );
    return { success: true, id, message: 'Vacancy Requirements saved.' };
  }
}

async function getVacancyRequirements(vacancyId) {
  const [rows] = await pool.query('SELECT * FROM vacancy_requirements WHERE vacancy_id = ?', [vacancyId]);
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    vacancyId: row.vacancy_id,
    minGpa: row.min_gpa,
    requiredSkills: safeJson(row.required_skills),
    requiredSemester: row.required_semester,
    customQuestions: safeJson(row.custom_questions),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// --- Application Reviews ---
async function saveApplicationReview(applicationId, reviewerType, review) {
  const id = makeId('arv');
  const [existing] = await pool.query('SELECT id FROM application_reviews WHERE application_id = ? AND reviewer_type = ?', [applicationId, reviewerType]);
  if (existing.length > 0) {
    await pool.query(
      'UPDATE application_reviews SET status = ?, feedback = ?, reviewed_at = CURRENT_TIMESTAMP WHERE application_id = ? AND reviewer_type = ?',
      [review.status || 'pending', review.feedback || '', applicationId, reviewerType]
    );
    return { success: true, message: 'Application review updated.' };
  } else {
    await pool.query(
      'INSERT INTO application_reviews (id, application_id, reviewer_type, status, feedback, reviewed_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [id, applicationId, reviewerType, review.status || 'pending', review.feedback || '']
    );
    return { success: true, id, message: 'Application review saved.' };
  }
}

async function getApplicationReviews(applicationId) {
  const [rows] = await pool.query('SELECT * FROM application_reviews WHERE application_id = ?', [applicationId]);
  return rows.map(r => ({
    id: r.id,
    applicationId: r.application_id,
    reviewerType: r.reviewer_type,
    status: r.status,
    feedback: r.feedback,
    reviewedAt: r.reviewed_at
  }));
}

// ==========================================
// MODULE EXPORTS
// ==========================================

module.exports = {
  // Auth
  login,
  register,

  // Dashboard
  getData,
  getDashboardSummary,
  getDashboardSummaryAdmin,
  getDashboardSummaryDospem,
  getDashboardSummaryMitra,

  // People
  getStudent,
  getLecturer,
  getCompany,
  getCompanyProfile,
  saveCompanyProfile,
  saveRoleProfile,
  getPrimaryCompany,

  // Interns
  getInterns,
  getIntern,

  // Logbooks
  getLogbooks,
  getLogbook,
  addLogbook,
  updateLogbook,
  approveLogbook,
  requestLogbookRevision,
  getLatestLogbookForIntern,
  getPendingLogbookForIntern,

  // Vacancies
  getVacancies,
  getVacancy,
  addVacancy,
  updateVacancy,

  // Applicants
  getApplicants,
  getApplicant,
  updateApplicant,

  // Applications
  getApplications,
  applyVacancy,
  approveApplication,
  reviewApplicationCv: saveApplicationReview,

  // SKS
  getSksConversions,
  convertSks,
  deleteSksConversion,

  // Evaluations
  getEvaluations,
  getEvaluation,
  getEvaluationCandidates,
  saveEvaluation,

  // Activities
  getRecentActivities,
  addActivity,

  // CV Management
  saveCvFile,
  getCvFile,
  deleteCvFile,
  saveCvDetails,
  getCvDetails,

  // Vacancy Requirements
  saveVacancyRequirements,
  getVacancyRequirements,

  // Application Reviews
  saveApplicationReview,
  getApplicationReviews
};
