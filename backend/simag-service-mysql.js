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
    company: {
      id: row.company_id,
      name: row.company_name || row.company || 'Unknown Company',
      email: row.company_email || '',
      location: row.company_location || row.location || ''
    },
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
    createdAt: row.created_at
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
    company: {
      id: row.company_id,
      name: row.company_name || row.company || 'Unknown Company'
    },
    lecturerId: row.lecturer_id,
    lecturer: {
      id: row.lecturer_id,
      name: row.lecturer_name || row.lecturer || 'Unknown Lecturer'
    },
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
    intern: {
      id: row.intern_id,
      name: row.intern_name || row.name || 'Mahasiswa',
      nim: row.intern_nim || row.nim || '-',
      company: row.intern_company || row.company || 'Mitra'
    },
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
    reviewer: {
      name: row.reviewer_name || row.reviewer || 'Dosen'
    }
  };
}

function mapApplication(row) {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id,
    student: {
      id: row.student_id,
      name: row.student_name || row.name || 'Mahasiswa',
      nim: row.student_nim || row.nim || '-',
      studyProgram: row.student_study_program || row.study_program || 'S1 Informatika'
    },
    vacancyId: row.vacancy_id,
    vacancy: {
      id: row.vacancy_id,
      title: row.vacancy_title || row.position || 'Magang',
      location: row.vacancy_location || 'Yogyakarta',
      workModel: row.vacancy_work_model || 'Hybrid',
      company: row.company_name || row.company || 'Mitra'
    },
    companyId: row.company_id,
    company: {
      id: row.company_id,
      name: row.company_name || row.company || 'Unknown Company'
    },
    lecturerId: row.lecturer_id,
    position: row.position,
    adminStatus: row.admin_status,
    partnerStatus: row.partner_status,
    status: row.status,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    // Add flat properties just in case other frontend code depends on it
    name: row.student_name || row.name || 'Mahasiswa',
    companyName: row.company_name || row.company || 'Unknown Company'
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
    discipline: Number(row.discipline_score || 0),
    initiative: Number(row.initiative_score || 0)
  };
  const scoreValues = Object.values(scores).filter(Number.isFinite);
  const finalScore = scoreValues.length
    ? Math.round(scoreValues.reduce((total, score) => total + score, 0) / scoreValues.length)
    : 0;
  return {
    id: row.id,
    candidateId: row.candidate_id,
    candidate: {
      id: row.candidate_id,
      name: row.candidate_name || row.name || 'Mahasiswa',
      nim: row.candidate_nim || row.nim || '-'
    },
    status: row.status,
    grade: row.grade || gradeFromScore(finalScore),
    scores,
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

function buildPeople(users, interns) {
  const studentUser = users.find((user) => user.role === 'mahasiswa') || {};
  const lecturerUser = users.find((user) => user.role === 'dospem') || {};
  const adminUser = users.find((user) => user.role === 'adminprodi') || {};
  const companyUser = users.find((user) => user.role === 'mitra') || {};
  const primaryIntern = interns.find((intern) => intern.id === studentUser.id) || interns[0] || {};

  return {
    student: {
      id: studentUser.id || primaryIntern.id || 'mahasiswa-demo',
      initials: initialsFromName(studentUser.name || primaryIntern.name, 'MD'),
      name: studentUser.name || primaryIntern.name || 'Mahasiswa Demo',
      nim: studentUser.identifier || primaryIntern.nim || '-',
      studyProgram: primaryIntern.studyProgram || 'S1 Informatika',
      semester: 6
    },
    lecturer: {
      id: lecturerUser.id || primaryIntern.lecturerId || 'dospem-demo',
      initials: initialsFromName(lecturerUser.name || primaryIntern.lecturer, 'DP'),
      name: lecturerUser.name || primaryIntern.lecturer || 'Dosen Pembimbing Demo',
      faculty: 'Fakultas Ilmu Komputer'
    },
    admin: {
      id: adminUser.id || 'admin-demo',
      initials: initialsFromName(adminUser.name, 'AP'),
      name: adminUser.name || 'Admin Prodi Demo'
    },
    company: {
      id: companyUser.id || primaryIntern.companyId || 'mitra-demo',
      initials: initialsFromName(companyUser.name || primaryIntern.company, 'MT'),
      name: companyUser.name || primaryIntern.company || 'Mitra Demo',
      shortName: (companyUser.name || primaryIntern.company || 'Mitra').replace(' (Persero) Tbk', ''),
      email: companyUser.identifier || '',
      website: '',
      industry: 'Teknologi',
      address: '',
      location: primaryIntern.company ? 'Yogyakarta' : '',
      tagline: '',
      logo: ''
    }
  };
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
// MOCK DATA RECONSTRUCTION FOR FRONTEND
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
  const people = buildPeople(mappedUsers, mappedInterns);

  return {
    people,
    companyProfile: people.company,
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
  const studentId = user?.role === 'mahasiswa' ? user.id : data.people.student.id;
  const intern = data.interns.find((item) => item.id === studentId) || null;

  if (!intern) {
    return {
      student: user?.role === 'mahasiswa'
        ? { id: user.id, name: user.name, nim: user.identifier, initials: initialsFromName(user.name, 'MD'), studyProgram: 'S1 Informatika' }
        : data.people.student,
      intern: null,
      company: data.people.company,
      lecturer: data.people.lecturer,
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
      ...data.people.student,
      id: intern.id,
      name: intern.name || data.people.student.name,
      nim: intern.nim || data.people.student.nim,
      studyProgram: intern.studyProgram || data.people.student.studyProgram,
      initials: intern.initials || data.people.student.initials
    },
    intern,
    company: { ...data.people.company, id: intern.companyId || data.people.company.id, name: intern.company?.name || intern.company || data.people.company.name },
    lecturer: { ...data.people.lecturer, id: intern.lecturerId || data.people.lecturer.id, name: intern.lecturer?.name || intern.lecturer || data.people.lecturer.name },
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
  const [[{ avg: scoreAverage }]] = await pool.query('SELECT ROUND(AVG(technical_score + communication_score + teamwork_score + discipline_score + initiative_score)/5) as avg FROM evaluations');
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

  const primaryInternId = 'mahasiswa-demo';
  const [[primarySks]] = await pool.query('SELECT sks, target, status FROM sks_conversions WHERE student_id = ?', [primaryInternId]);
  const [[primaryIntern]] = await pool.query('SELECT progress FROM interns WHERE id = ?', [primaryInternId]);

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
    primarySks: primarySks || { sks: 0, target: 20 },
    primaryInternProgress: primaryIntern ? primaryIntern.progress : 0,
    reviewLogbookCount: reviewLogbookCount || 0,
    waitingEval: waitingEval || 0,
    activeVacancyCount: activeVacancyCount || 0,
    internCount: activeStudents || 0,
    pendingApprovalCount: pendingApplications || 0
  };
}

async function getDashboardSummaryDospem() {
  const [[{ count: internCount }]] = await pool.query('SELECT COUNT(*) as count FROM interns');
  const [[{ count: reviewLogbookCount }]] = await pool.query('SELECT COUNT(*) as count FROM logbooks WHERE status IN ("submitted", "pending", "revision")');
  const [[{ count: waitingEvaluations }]] = await pool.query('SELECT COUNT(*) as count FROM interns i LEFT JOIN evaluations e ON i.id = e.candidate_id WHERE e.id IS NULL');
  const [[{ avg: averageProgress }]] = await pool.query('SELECT ROUND(AVG(progress)) as avg FROM interns');
  const [[{ count: activeVacancyCount }]] = await pool.query('SELECT COUNT(*) as count FROM vacancies WHERE status = "active"');
  const [[{ count: totalSksConversions }]] = await pool.query('SELECT COUNT(*) as count FROM sks_conversions');

  const [internsRows] = await pool.query('SELECT * FROM interns ORDER BY created_at DESC LIMIT 5');
  const interns = internsRows.map(mapIntern);
  const [logbooksRows] = await pool.query('SELECT * FROM logbooks WHERE status IN ("submitted", "pending", "revision") ORDER BY date DESC LIMIT 5');
  const reviewLogbooks = logbooksRows.map(mapLogbook);
  const [allLogbooksRows] = await pool.query('SELECT * FROM logbooks ORDER BY date DESC LIMIT 5');
  const _allLogbooks = allLogbooksRows.map(mapLogbook);
  const [sksRows] = await pool.query('SELECT * FROM sks_conversions LIMIT 5');
  const sksConversions = sksRows.map(row => ({ id: row.id, studentId: row.student_id, sks: row.sks, target: row.target, status: row.status, convertedAt: row.converted_at }));

  const primaryInternId = 'mahasiswa-demo';
  const [[primarySks]] = await pool.query('SELECT sks, target, status FROM sks_conversions WHERE student_id = ?', [primaryInternId]);
  const [[primaryInternStats]] = await pool.query('SELECT progress, logbook_completed as logbookCompleted FROM interns WHERE id = ?', [primaryInternId]);

  return {
    interns,
    reviewLogbooks,
    _allLogbooks,
    waitingEvaluations: waitingEvaluations || 0,
    averageProgress: Number(averageProgress || 0),
    sksConversions,
    primarySks: primarySks || { sks: 0, target: 20 },
    primaryInternStats: primaryInternStats || { progress: 0, logbookCompleted: 0 },
    activeVacancyCount: activeVacancyCount || 0,
    internCount: internCount || 0,
    totalSksConversions: totalSksConversions || 0
  };
}

async function getDashboardSummaryMitra(userId) {
  const companyId = userId || 'mitra-demo';
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

  return {
    interns,
    vacancies,
    applicants,
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
async function getLogbooks(userId) {
  let query = `
    SELECT l.*, i.name as intern_name, i.nim as intern_nim, i.company as intern_company 
    FROM logbooks l
    LEFT JOIN interns i ON l.intern_id = i.id
  `;
  const params = [];
  if (userId) {
    query += ' WHERE l.intern_id = ?';
    params.push(userId);
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
  if (vacancyId) {
    const [rows] = await pool.query('SELECT * FROM applicants WHERE vacancy_id = ?', [vacancyId]);
    return rows.map(a => ({ ...a, skills: safeJson(a.skills, []) }));
  }
  const [rows] = await pool.query('SELECT * FROM applicants');
  return rows.map(a => ({ ...a, skills: safeJson(a.skills, []) }));
}

async function getApplicant(id) {
  const [rows] = await pool.query('SELECT * FROM applicants WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return { ...rows[0], skills: safeJson(rows[0].skills, []) };
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
  return { success: true, message: 'Pelamar berhasil diperbarui.' };
}

// --- Applications ---
async function getApplications() {
  const [rows] = await pool.query(`
    SELECT a.*, 
           s.name as student_name, s.identifier as student_nim, 
           v.title as vacancy_title, v.location as vacancy_location, v.work_model as vacancy_work_model, 
           u.name as company_name
    FROM applications a
    LEFT JOIN users s ON a.student_id = s.linked_id
    LEFT JOIN vacancies v ON a.vacancy_id = v.id
    LEFT JOIN users u ON a.company_id = u.linked_id
  `);
  return rows.map(mapApplication);
}

async function applyVacancy(vacancyId, userId) {
  const id = makeId('apply');
  try {
    await pool.query(
      `INSERT INTO applications (id, student_id, vacancy_id, status, submitted_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, userId, vacancyId, 'pending', new Date().toISOString()]
    );
    await addActivity({ type: 'application', title: 'Lamaran baru diajukan', meta: 'Baru saja', icon: 'AP' });
    return { success: true, id, message: 'Lamaran berhasil diajukan.' };
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return { success: false, message: 'Vacancy ID tidak valid atau tidak ditemukan.' };
    }
    throw err;
  }
}

async function approveApplication(id) {
  await pool.query(
    'UPDATE applications SET admin_status = ?, status = ?, approved_at = ? WHERE id = ?',
    ['approved', 'approved', new Date().toISOString(), id]
  );
  return { success: true, message: 'Lamaran disetujui.' };
}

// --- SKS Conversions ---
async function getSksConversions() {
  const [rows] = await pool.query('SELECT * FROM sks_conversions');
  return rows;
}

async function convertSks(studentId, sks) {
  const id = makeId('sks');
  await pool.query(
    'INSERT INTO sks_conversions (id, student_id, sks, target, status, converted_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, studentId, sks, sks * 16, 'pending', new Date().toISOString()]
  );
  return { success: true, id, message: 'Konversi SKS berhasil.' };
}

async function deleteSksConversion(studentId) {
  await pool.query('DELETE FROM sks_conversions WHERE student_id = ?', [studentId]);
  return { success: true, message: 'Konversi SKS dihapus.' };
}

// --- Evaluations ---
async function getEvaluations() {
  const [rows] = await pool.query(`
    SELECT e.*, i.name as candidate_name, i.nim as candidate_nim 
    FROM evaluations e
    LEFT JOIN interns i ON e.candidate_id = i.id
  `);
  return rows.map(mapEvaluation);
}

async function getEvaluation(candidateId) {
  const [rows] = await pool.query(`
    SELECT e.*, i.name as candidate_name, i.nim as candidate_nim 
    FROM evaluations e
    LEFT JOIN interns i ON e.candidate_id = i.id
    WHERE e.candidate_id = ?
  `, [candidateId]);
  return mapEvaluation(rows[0]);
}

async function getEvaluationCandidates() {
  const [rows] = await pool.query(
    `SELECT i.id, i.name, i.nim, i.company, i.position, i.status, i.progress
     FROM interns i
     WHERE i.status IN ('active', 'Aktif', 'Menunggu Evaluasi')
     ORDER BY i.name`
  );
  return rows;
}

async function saveEvaluation(body) {
  const id = makeId('eval');
  await pool.query(
    `INSERT INTO evaluations (id, candidate_id, status, grade, technical_score, communication_score, teamwork_score, discipline_score, initiative_score, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       status = VALUES(status), grade = VALUES(grade),
       technical_score = VALUES(technical_score), communication_score = VALUES(communication_score),
       teamwork_score = VALUES(teamwork_score), discipline_score = VALUES(discipline_score),
       initiative_score = VALUES(initiative_score), notes = VALUES(notes)`,
    [id, body.candidateId, body.status || 'completed', body.grade || '',
     body.technicalScore || body.technical_score || 0,
     body.communicationScore || body.communication_score || 0,
     body.teamworkScore || body.teamwork_score || 0,
     body.disciplineScore || body.discipline_score || 0,
     body.initiativeScore || body.initiative_score || 0,
     body.notes || body.feedback || '']
  );
  return { success: true, id, message: 'Evaluasi berhasil disimpan.' };
}

// --- Activities ---
async function getRecentActivities() {
  const [rows] = await pool.query('SELECT * FROM activities ORDER BY created_at DESC LIMIT 12');
  return rows;
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
  addActivity
};
