'use strict';

const crypto = require('node:crypto');
const { clone, readData, resetData, updateData } = require('./store');

const allowedRoles = ['mahasiswa', 'adminprodi', 'mitra', 'dospem'];

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

function initialsFromName(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'SM';
}

function statusLabel(status) {
  const map = {
    submitted: 'Submitted',
    pending: 'Submitted',
    approved: 'Approved',
    revision: 'Revision',
    rejected: 'Rejected'
  };
  return map[status] || status || 'Submitted';
}

function statusBadge(status) {
  if (['approved', 'Approved', 'Accepted', 'Completed'].includes(status)) return 'badge-success';
  if (['revision', 'Revision', 'Pending', 'Waiting', 'Menunggu', 'Diproses', 'Perlu Review'].includes(status)) return 'badge-warning';
  if (['Rejected', 'Ditolak', 'rejected'].includes(status)) return 'badge-danger';
  return 'badge-info';
}

function addActivity(data, activity) {
  data.activities.unshift({
    id: activity.id || makeId('activity'),
    type: activity.type || 'system',
    title: activity.title,
    meta: activity.meta || 'Baru saja',
    icon: activity.icon || 'SI',
    at: activity.at || new Date().toISOString()
  });
  data.activities = data.activities.slice(0, 12);
}

function getStudent(data, studentId) {
  if (!studentId || studentId === data.people.student.id) return data.people.student;
  const application = data.applications.find((item) => item.studentId === studentId);
  if (application) {
    return {
      id: application.studentId,
      initials: application.initials || initialsFromName(application.name || 'Mahasiswa'),
      name: application.name || 'Mahasiswa',
      nim: application.nim || '-',
      studyProgram: application.studyProgram || 'S1 Informatika',
      semester: application.semester || 6
    };
  }
  const applicant = data.applicants.find((item) => item.studentId === studentId);
  if (applicant) {
    return {
      id: applicant.studentId,
      initials: initialsFromName(applicant.name),
      name: applicant.name,
      nim: applicant.nim,
      studyProgram: applicant.studyProgram,
      semester: applicant.semester || 6
    };
  }
  return data.people.student;
}

function getPrimaryIntern(data) {
  return data.interns.find((intern) => intern.id === data.people.student.id) || data.interns[0];
}

function getLatestLogbookForIntern(data, internId) {
  return data.logbooks
    .filter((logbook) => logbook.internId === internId)
    .sort((a, b) => new Date(b.submittedAt || b.date) - new Date(a.submittedAt || a.date))[0] || null;
}

function getPendingLogbookForIntern(data, internId) {
  return data.logbooks.find(
    (logbook) => logbook.internId === internId && ['submitted', 'pending', 'revision'].includes(logbook.status)
  ) || null;
}

function recalculateIntern(data, internId) {
  const intern = data.interns.find((item) => item.id === internId);
  if (!intern) return;

  const internLogbooks = data.logbooks.filter((item) => item.internId === internId);
  const application = data.applications.find((item) => item.studentId === internId);
  intern.status = application ? application.status : intern.status;
  intern.logbookCompleted = Math.max(intern.logbookCompleted || 0, internLogbooks.length);
}

function login({ identifier, password, role }) {
  const data = readData();
  const normalizedRole = String(role || '').toLowerCase();
  const normalizedIdentifier = String(identifier || '').toLowerCase();
  const user = data.users.find((item) => (
    item.role === normalizedRole &&
    String(item.identifier).toLowerCase() === normalizedIdentifier &&
    item.password === password
  ));

  if (!allowedRoles.includes(normalizedRole) || !user) {
    return {
      success: false,
      message: 'Kredensial tidak valid. Gunakan akun demo atau daftar akun baru.'
    };
  }

  return {
    success: true,
    token: `simag_${normalizedRole}_${crypto.randomBytes(18).toString('hex')}`,
    role: normalizedRole,
    user: {
      id: user.linkedId || user.id,
      name: user.name,
      identifier: user.identifier,
      role: user.role
    }
  };
}

function register({ fullname, name, identifier, password, role }) {
  const normalizedRole = String(role || '').toLowerCase();
  if (!allowedRoles.includes(normalizedRole)) {
    return { success: false, message: 'Role tidak dikenali.' };
  }
  if (!identifier || !password || (!fullname && !name)) {
    return { success: false, message: 'Nama, identifier, dan password wajib diisi.' };
  }

  return updateData((data) => {
    const existing = data.users.find(
      (item) => item.role === normalizedRole && String(item.identifier).toLowerCase() === String(identifier).toLowerCase()
    );
    if (existing) {
      return { success: false, message: 'Akun dengan identifier tersebut sudah terdaftar.' };
    }

    const displayName = fullname || name;
    const user = {
      id: makeId('user'),
      role: normalizedRole,
      identifier,
      password,
      name: displayName,
      linkedId: makeId(normalizedRole)
    };
    data.users.push(user);

    if (normalizedRole === 'mitra') {
      const savedVacancy = {
        id: makeId('vacancy'),
        title: 'Intern',
        company: displayName,
        companyId: user.linkedId,
        badge: 'Sesuai Jurusan',
        location: 'Remote',
        workModel: 'WFA',
        quota: 5,
        deadline: '31 Des 2026',
        description: 'Lowongan default untuk perusahaan baru.',
        status: 'active',
        qualifications: ['S1 Semester 6/7'],
        responsibilities: ['Membantu proyek tim']
      };
      data.vacancies.unshift(savedVacancy);
    }

    addActivity(data, {
      type: 'auth',
      title: `${displayName} mendaftar sebagai ${normalizedRole}`,
      meta: 'Akun baru dibuat',
      icon: 'AU'
    });

    return {
      success: true,
      message: 'Pendaftaran berhasil.',
      user: {
        id: user.linkedId,
        name: user.name,
        identifier: user.identifier,
        role: user.role
      }
    };
  });
}

function getDashboardSummary(userId) {
  const data = readData();

  // Find the logged-in user's record
  const user = userId ? data.users.find((u) => u.linkedId === userId || u.id === userId) : null;

  // If we have a user, find their intern record by their linkedId
  const studentId = user ? (user.linkedId || user.id) : null;

  // Try to find intern record for this specific user
  let intern = studentId ? data.interns.find((i) => i.id === studentId) : null;

  // If no intern found for this user, return empty/onboarding state
  if (!intern) {
    const studentName = user ? user.name : (data.people.student.name);
    const studentNim = user ? (user.identifier || '-') : data.people.student.nim;
    const emptyStudent = {
      id: studentId || data.people.student.id,
      name: studentName,
      nim: studentNim,
      studyProgram: 'S1 Informatika',
      initials: initialsFromName(studentName)
    };
    return clone({
      student: emptyStudent,
      lecturer: data.people.lecturer,
      company: null,
      intern: null,
      application: data.applications.find((a) => a.studentId === studentId) || null,
      logbooks: [],
      submittedLogbooks: [],
      revisionLogbooks: [],
      evaluation: null,
      sks: { sks: 0, target: 20, status: 'Pending' },
      activities: data.activities
    });
  }

  // Intern found — return full data scoped to this user
  const logbooks = data.logbooks.filter((item) => item.internId === intern.id);
  const submittedLogbooks = logbooks.filter((item) => ['submitted', 'pending'].includes(item.status));
  const revisionLogbooks = logbooks.filter((item) => item.status === 'revision');
  const evaluation = data.evaluations.find((item) => item.candidateId === intern.id) || null;
  const sks = data.sksConversions.find((item) => item.studentId === intern.id) || { sks: 0, target: 20, status: 'Pending' };
  const application = data.applications.find((item) => item.studentId === intern.id) || null;

  // Resolve student info
  const student = user
    ? { id: intern.id, name: user.name, nim: user.identifier || intern.nim, studyProgram: intern.studyProgram || 'S1 Informatika', initials: initialsFromName(user.name) }
    : data.people.student;

  // Resolve company
  const company = intern.companyId
    ? { name: intern.company || data.people.company.name, location: intern.location || data.people.company.location }
    : data.people.company;

  return clone({
    student,
    lecturer: data.people.lecturer,
    company,
    intern,
    application,
    logbooks,
    submittedLogbooks,
    revisionLogbooks,
    evaluation,
    sks,
    activities: data.activities
  });
}

function getDashboardSummaryMitra() {
  const data = readData();
  return clone({
    interns: data.interns,
    logbooks: data.logbooks,
    vacancies: data.vacancies,
  });
}

function getDashboardSummaryAdmin() {
  const data = readData();
  const pending = data.applications.filter(a => a.adminStatus === 'Pending');
  const totalSks = data.sksConversions.reduce((t, s) => t + Number(s.sks || 0), 0);
  const pendingSks = data.interns.filter(i => {
    const c = data.sksConversions.find(s => s.studentId === i.id);
    return !c || c.status !== 'Completed';
  }).length;
  const companyCount = new Set([...data.vacancies.map(v => v.companyId || v.company), ...data.interns.map(i => i.companyId || i.company)].filter(Boolean)).size;
  const scoreAverage = data.evaluations.length ? Math.round(data.evaluations.reduce((t, e) => t + Number(e.finalScore || 0), 0) / data.evaluations.length) : 0;
  const reviewLogbooks = data.logbooks.filter(l => ['submitted', 'pending', 'revision'].includes(l.status));
  const evalIds = new Set(data.evaluations.map(e => e.candidateId));
  const waitingEval = data.interns.filter(i => !evalIds.has(i.id)).length;
  const primaryIntern = data.interns.find(i => i.id === data.people.student.id) || data.interns[0];
  const primarySks = primaryIntern ? data.sksConversions.find(s => s.studentId === primaryIntern.id) || { sks: 0, target: 20 } : { sks: 0, target: 20 };
  const activeVacancies = data.vacancies.filter(v => v.status === 'active');

  const pendingApplications = pending.map(app => {
    const u = data.users.find(u => u.linkedId === app.studentId || u.id === app.studentId);
    const v = data.vacancies.find(v => v.id === app.vacancyId) || {};
    const cu = data.users.find(u => u.linkedId === app.companyId || u.id === app.companyId);
    return { ...app, name: u ? u.name : (app.name || 'Mahasiswa'), companyName: cu ? cu.name : (v.company || (data.people.company && data.people.company.name)) };
  });

  return clone({
    pendingApplications,
    pendingSks,
    activities: data.activities || [],
    stats: { activeStudents: data.interns.length, companyCount: companyCount || 0, totalSks, scoreAverage },
    connectionSummary: `${data.applications.length} pendaftaran - ${data.logbooks.length} logbook`,
    primarySks,
    primaryInternProgress: primaryIntern ? primaryIntern.progress : null,
    reviewLogbookCount: reviewLogbooks.length,
    waitingEval,
    activeVacancyCount: activeVacancies.length,
    internCount: data.interns.length,
    pendingApprovalCount: pending.length
  });
}

function getDashboardSummaryDospem() {
  const data = readData();
  const reviewLogbooks = data.logbooks.filter(l => ['submitted', 'pending', 'revision'].includes(l.status));
  const evalIds = new Set(data.evaluations.map(e => e.candidateId));
  const waitingEvaluations = data.interns.filter(i => !evalIds.has(i.id)).length;
  const averageProgress = data.interns.length ? Math.round(data.interns.reduce((t, i) => t + i.progress, 0) / data.interns.length) : 0;
  const primaryIntern = data.interns.find(i => i.id === data.people.student.id) || data.interns[0];
  const primarySks = primaryIntern ? data.sksConversions.find(s => s.studentId === primaryIntern.id) || { sks: 0, target: 20 } : { sks: 0, target: 20 };
  const activeVacancies = data.vacancies.filter(v => v.status === 'active');

  return clone({
    interns: data.interns,
    reviewLogbooks,
    _allLogbooks: data.logbooks,
    waitingEvaluations,
    averageProgress,
    sksConversions: data.sksConversions,
    primarySks,
    primaryInternStats: primaryIntern ? { progress: primaryIntern.progress, logbookCompleted: primaryIntern.logbookCompleted } : null,
    activeVacancyCount: activeVacancies.length,
    internCount: data.interns.length,
    totalSksConversions: data.sksConversions.length
  });
}

function addLogbook(logbook, userId) {
  return updateData((data) => {
    let intern = null;
    if (userId) {
      const user = data.users.find(u => u.id === userId || u.linkedId === userId);
      const studentId = user ? (user.linkedId || user.id) : null;
      intern = data.interns.find(i => i.id === studentId);
    }
    if (!intern) intern = getPrimaryIntern(data);
    
    const title = logbook.title || logbook.activity || 'Logbook Magang';
    const savedLogbook = {
      id: logbook.id || makeId('log'),
      internId: logbook.internId || intern.id,
      date: logbook.date,
      startTime: logbook.startTime || '',
      endTime: logbook.endTime || '',
      title,
      activity: title,
      description: logbook.description || logbook.activity || title,
      result: logbook.result || '',
      obstacle: logbook.obstacle || '',
      status: 'submitted',
      note: '',
      submittedAt: new Date().toISOString(),
      reviewer: ''
    };

    data.logbooks.unshift(savedLogbook);
    const target = intern.logbookTarget || 150;
    intern.logbookCompleted = Math.min(target, (intern.logbookCompleted || 0) + 1);
    recalculateIntern(data, savedLogbook.internId);
    addActivity(data, {
      type: 'logbook',
      title: `${intern.name} mengirim logbook ${title}`,
      meta: 'Status Submitted',
      icon: 'LB'
    });
    return savedLogbook;
  });
}

function updateLogbook(logbookId, changes) {
  return updateData((data) => {
    const logbookIndex = data.logbooks.findIndex((item) => item.id === logbookId);
    if (logbookIndex === -1) return null;

    const previousStatus = data.logbooks[logbookIndex].status;
    const updatedLogbook = {
      ...data.logbooks[logbookIndex],
      ...changes
    };
    if (changes.status && changes.status !== previousStatus) {
      updatedLogbook.reviewedAt = new Date().toISOString();
      updatedLogbook.reviewer = changes.reviewer || data.people.lecturer.name;
    }

    data.logbooks[logbookIndex] = updatedLogbook;
    recalculateIntern(data, updatedLogbook.internId);

    if (changes.status) {
      const intern = data.interns.find((item) => item.id === updatedLogbook.internId) || getPrimaryIntern(data);
      addActivity(data, {
        type: 'logbook',
        title: `${intern.name} - logbook ${statusLabel(changes.status)}`,
        meta: `${updatedLogbook.title} - oleh ${updatedLogbook.reviewer || data.people.lecturer.name}`,
        icon: 'LG'
      });
    }

    return updatedLogbook;
  });
}

function updateCollection(collectionName, itemId, changes) {
  return updateData((data) => {
    const collection = data[collectionName] || [];
    const itemIndex = collection.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) return null;

    collection[itemIndex] = { ...collection[itemIndex], ...changes };
    return collection[itemIndex];
  });
}

function addVacancy(vacancy) {
  return updateData((data) => {
    const savedVacancy = {
      id: vacancy.id || makeId('vacancy'),
      title: vacancy.title,
      companyId: 'bank-mandiri',
      company: data.people.company.name,
      location: vacancy.location,
      workModel: vacancy.workModel,
      quota: Number(vacancy.quota || 0),
      deadline: vacancy.deadline,
      description: vacancy.description || '',
      qualifications: vacancy.qualifications || [],
      responsibilities: vacancy.responsibilities || [],
      status: 'active',
      badge: 'Terbuka'
    };
    data.vacancies.unshift(savedVacancy);
    addActivity(data, {
      type: 'vacancy',
      title: `${data.people.company.shortName} membuka lowongan ${vacancy.title}`,
      meta: `${vacancy.location} - ${vacancy.workModel}`,
      icon: 'LW'
    });
    return savedVacancy;
  });
}

function updateApplicant(id, changes) {
  return updateData((data) => {
    const applicantIndex = data.applicants.findIndex((item) => item.id === id);
    if (applicantIndex === -1) return null;
    data.applicants[applicantIndex] = { ...data.applicants[applicantIndex], ...changes };
    const applicant = data.applicants[applicantIndex];

    if (changes.status === 'Diterima' || changes.status === 'Accepted') {
      const application = data.applications.find((item) => item.studentId === applicant.studentId);
      if (application) {
        application.partnerStatus = 'Accepted';
        application.status = 'Accepted';
        application.acceptedAt = new Date().toISOString();
      }

      const existingIntern = data.interns.find((intern) => intern.id === applicant.studentId);
      if (existingIntern) {
        existingIntern.status = 'Accepted';
      } else {
        const vacancy = data.vacancies.find((item) => item.id === applicant.vacancyId) || data.vacancies[0];
        data.interns.push({
          id: applicant.studentId,
          initials: initialsFromName(applicant.name),
          name: applicant.name,
          nim: applicant.nim,
          institution: `${applicant.studyProgram} - Universitas Amikom Yogyakarta`,
          studyProgram: applicant.studyProgram,
          companyId: 'bank-mandiri',
          company: data.people.company.name,
          lecturerId: data.people.lecturer.id,
          lecturer: data.people.lecturer.name,
          position: vacancy.title,
          status: 'Accepted',
          progress: 0,
          logbookCompleted: 0,
          logbookTarget: 150,
          period: '15 Jun 2026 - 15 Des 2026',
          startDate: '2026-06-15',
          endDate: '2026-12-15',
          mentor: 'Budi Santoso',
          attendance: '0 / 0 Hari',
          logbookWeek: 'Minggu ke-1'
        });
      }

      addActivity(data, {
        type: 'internship',
        title: `${data.people.company.shortName} menerima ${applicant.name}`,
        meta: 'Status Accepted',
        icon: 'AC'
      });
    } else if (changes.status === 'Ditolak' || changes.status === 'Rejected') {
      const application = data.applications.find((item) => item.studentId === applicant.studentId);
      if (application) {
        application.partnerStatus = 'Rejected';
        application.status = 'Rejected';
      }
      addActivity(data, {
        type: 'internship',
        title: `${data.people.company.shortName} menolak pendaftaran ${applicant.name}`,
        meta: 'Status Rejected',
        icon: 'RJ'
      });
    }

    return applicant;
  });
}

function approveApplication(applicationId) {
  return updateData((data) => {
    const application = data.applications.find((item) => item.id === applicationId);
    if (!application) return null;

    application.adminStatus = 'Approved';
    application.status = application.partnerStatus === 'Accepted' ? 'Accepted' : 'Approved';
    application.approvedAt = new Date().toISOString();

    const existingIntern = data.interns.find((intern) => intern.id === application.studentId);
    if (existingIntern) {
      existingIntern.status = application.status;
    } else {
      const vacancy = data.vacancies.find((item) => item.id === application.vacancyId) || data.vacancies[0];
      const student = getStudent(data, application.studentId);
      data.interns.push({
        id: application.studentId,
        initials: student.initials || initialsFromName(student.name),
        name: student.name,
        nim: student.nim,
        institution: `${student.studyProgram} - Universitas Amikom Yogyakarta`,
        studyProgram: student.studyProgram,
        companyId: 'bank-mandiri',
        company: data.people.company.name,
        lecturerId: data.people.lecturer.id,
        lecturer: data.people.lecturer.name,
        position: application.position || vacancy.title,
        status: application.status,
        progress: 0,
        logbookCompleted: 0,
        logbookTarget: 150,
        period: '15 Jun 2026 - 15 Des 2026',
        startDate: '2026-06-15',
        endDate: '2026-12-15',
        mentor: 'Budi Santoso',
        attendance: '0 / 0 Hari',
        logbookWeek: 'Minggu ke-1'
      });
    }

    addActivity(data, {
      type: 'approval',
      title: `Admin menyetujui pendaftaran ${getStudent(data, application.studentId).name}`,
      meta: 'Status Approved - muncul di dashboard Mitra dan Dosen',
      icon: 'AP'
    });
    return application;
  });
}

function applyVacancy(vacancyId, userId) {
  return updateData((data) => {
    let student = data.people.student;
    if (userId) {
      const user = data.users.find(u => u.id === userId || u.linkedId === userId);
      if (user) {
        student = {
          ...student,
          id: user.linkedId || user.id,
          name: user.name,
          nim: user.identifier || student.nim
        };
      }
    }
    const vacancy = data.vacancies.find((item) => item.id === vacancyId) || data.vacancies[0];
    const existingApplication = data.applications.find(
      (item) => item.studentId === student.id && item.vacancyId === vacancy.id
    );

    if (existingApplication) return existingApplication;

    const application = {
      id: makeId(`app-${student.id}`),
      studentId: student.id,
      vacancyId: vacancy.id,
      companyId: vacancy.companyId || 'bank-mandiri',
      lecturerId: data.people.lecturer.id,
      position: vacancy.title,
      adminStatus: 'Pending',
      partnerStatus: 'Waiting',
      status: 'Pending',
      submittedAt: new Date().toISOString()
    };

    data.applications.unshift(application);
    data.applicants.unshift({
      id: makeId(`applicant-${student.id}`),
      studentId: student.id,
      vacancyId: vacancy.id,
      name: student.name,
      nim: student.nim,
      studyProgram: student.studyProgram,
      semester: student.semester,
      gpa: '3.86',
      skills: ['Java', 'Spring Boot', 'REST API'],
      status: 'Menunggu'
    });

    addActivity(data, {
      type: 'application',
      title: `${student.name} mendaftar ${vacancy.title}`,
      meta: 'Menunggu approval Admin Prodi',
      icon: 'PD'
    });
    return application;
  });
}

function convertSks(studentId, sks) {
  return updateData((data) => {
    const selectedStudentId = studentId || data.people.student.id;
    const conversion = data.sksConversions.find((item) => item.studentId === selectedStudentId);
    const nextConversion = {
      id: conversion ? conversion.id : `sks-${selectedStudentId}`,
      studentId: selectedStudentId,
      sks: Number(sks),
      target: 20,
      status: 'Completed',
      convertedAt: new Date().toISOString()
    };

    if (conversion) {
      Object.assign(conversion, nextConversion);
    } else {
      data.sksConversions.push(nextConversion);
    }

    addActivity(data, {
      type: 'sks',
      title: `Konversi SKS ${getStudent(data, selectedStudentId).name} Completed`,
      meta: `${Number(sks)} SKS dikonversi`,
      icon: 'SK'
    });
    return nextConversion;
  });
}

function deleteSksConversion(studentId) {
  return updateData((data) => {
    const idx = data.sksConversions.findIndex(item => item.studentId === studentId);
    if (idx !== -1) {
      data.sksConversions.splice(idx, 1);
    }
    return { success: true, message: 'Data konversi berhasil dihapus' };
  });
}

function saveEvaluation(evaluation) {
  return updateData((data) => {
    const existingIndex = data.evaluations.findIndex(
      (item) => item.candidateId === evaluation.candidateId
    );
    const scoreValues = Object.values(evaluation.scores || {}).map(Number).filter(Number.isFinite);
    const finalScore = evaluation.finalScore || (
      scoreValues.length ? Math.round(scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length) : 0
    );
    const savedEvaluation = {
      ...evaluation,
      id: existingIndex >= 0 ? data.evaluations[existingIndex].id : makeId('evaluation'),
      finalScore,
      grade: finalScore >= 90 ? 'A-' : finalScore >= 80 ? 'B+' : 'B',
      submittedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      data.evaluations[existingIndex] = savedEvaluation;
    } else {
      data.evaluations.push(savedEvaluation);
    }

    addActivity(data, {
      type: 'evaluation',
      title: `${data.people.company.shortName} mengirim nilai untuk ${getStudent(data, evaluation.candidateId).name}`,
      meta: `Nilai akhir ${savedEvaluation.finalScore} (${savedEvaluation.grade})`,
      icon: 'EV'
    });
    return savedEvaluation;
  });
}

function saveCompanyProfile(changes) {
  return updateData((data) => {
    data.companyProfile = { ...data.companyProfile, ...changes };
    data.people.company.name = data.companyProfile.name;
    data.people.company.shortName = data.companyProfile.name.replace(' (Persero) Tbk', '');
    data.people.company.email = data.companyProfile.email;
    data.people.company.website = data.companyProfile.website;
    data.people.company.address = data.companyProfile.address;
    data.people.company.tagline = data.companyProfile.tagline;
    data.people.company.logo = data.companyProfile.logo;
    return data.companyProfile;
  });
}

function saveRoleProfile(role, changes) {
  return updateData((data) => {
    const roleMap = {
      mahasiswa: 'student',
      dospem: 'lecturer',
      adminprodi: 'admin'
    };
    const peopleKey = roleMap[role];
    if (!peopleKey || !data.people[peopleKey]) return null;

    data.people[peopleKey] = {
      ...data.people[peopleKey],
      ...changes
    };

    if (peopleKey === 'lecturer') {
      data.interns.forEach((intern) => {
        intern.lecturer = data.people.lecturer.name;
        intern.lecturerId = data.people.lecturer.id;
      });
      data.applications.forEach((application) => {
        application.lecturerId = data.people.lecturer.id;
      });
    }

    return data.people[peopleKey];
  });
}

function getEvaluationCandidates() {
  const data = readData();
  return data.interns.map((intern) => ({
    id: intern.id,
    initials: intern.initials,
    name: intern.name,
    position: intern.position,
    period: intern.period,
    logbookCompleted: intern.logbookCompleted,
    logbookTarget: intern.logbookTarget
  }));
}

function listApplicants(vacancyId) {
  const data = readData();
  return data.applicants.filter((item) => !vacancyId || item.vacancyId === vacancyId);
}


module.exports = {
  login,
  register,
  resetData,
  statusLabel,
  statusBadge,
  getData: readData,
  getDashboardSummary,
  getDashboardSummaryMitra,
  getDashboardSummaryAdmin,
  getDashboardSummaryDospem,
  getStudent: () => clone(readData().people.student),
  getLecturer: () => clone(readData().people.lecturer),
  getCompany: () => clone(readData().people.company),
  getInterns: () => clone(readData().interns),
  getIntern: (id) => clone(readData().interns.find((item) => item.id === id) || null),
  getLogbooks: (userId) => {
    const data = readData();
    if (!userId) return clone(data.logbooks);
    // Find the intern record for this user
    const user = data.users.find((u) => u.linkedId === userId || u.id === userId);
    const studentId = user ? (user.linkedId || user.id) : userId;
    return clone(data.logbooks.filter((lb) => lb.internId === studentId));
  },
  getLogbook: (id) => clone(readData().logbooks.find((item) => item.id === id) || null),
  getLatestLogbookForIntern: (internId) => clone(getLatestLogbookForIntern(readData(), internId)),
  getPendingLogbookForIntern: (internId) => clone(getPendingLogbookForIntern(readData(), internId)),
  addLogbook,
  updateLogbook,
  approveLogbook: (id) => {
    const lecturer = readData().people.lecturer;
    return updateLogbook(id, {
      status: 'approved',
      note: `Disetujui oleh ${lecturer.name}.`,
      reviewer: lecturer.name
    });
  },
  requestLogbookRevision: (id, note) => {
    const lecturer = readData().people.lecturer;
    return updateLogbook(id, { status: 'revision', note, reviewer: lecturer.name });
  },
  getVacancies: () => clone(readData().vacancies),
  getVacancy: (id) => clone(readData().vacancies.find((item) => item.id === id) || null),
  addVacancy,
  updateVacancy: (id, changes) => updateCollection('vacancies', id, changes),
  getApplicants: listApplicants,
  getApplicant: (id) => clone(readData().applicants.find((item) => item.id === id) || null),
  updateApplicant,
  getApplications: () => clone(readData().applications),
  approveApplication,
  applyVacancy,
  convertSks,
  deleteSksConversion,
  getEvaluationCandidates,
  getEvaluations: () => clone(readData().evaluations),
  getEvaluation: (candidateId) => clone(readData().evaluations.find((item) => item.candidateId === candidateId) || null),
  saveEvaluation,
  getSksConversions: () => clone(readData().sksConversions),
  getCompanyProfile: () => clone(readData().companyProfile),
  saveCompanyProfile,
  saveRoleProfile,
  getRecentActivities: () => clone(readData().activities),
  
  login: async (body) => {
    const jwt = require('jsonwebtoken');
    const data = readData();
    const user = data.users.find(u => u.identifier === body.identifier);
    if (!user || body.password !== '123') {
      return { success: false, message: 'Invalid credentials' };
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'simag-super-secret-key-2026', { expiresIn: '8h' });
    return { success: true, token, user };
  },

  register: async (body) => {
    const jwt = require('jsonwebtoken');
    return updateData(data => {
      if (data.users.find(u => u.identifier === body.identifier)) {
        return { success: false, message: 'User already exists' };
      }
      const newUser = {
        id: makeId('usr-'),
        name: body.name,
        identifier: body.identifier,
        role: body.role || 'mahasiswa',
        linkedId: makeId('intern-')
      };
      data.users.push(newUser);
      
      const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET || 'simag-super-secret-key-2026', { expiresIn: '8h' });
      return { success: true, token, user: newUser };
    });
  }
};
