'use strict';

(function initSimagData(global) {
  const STORAGE_KEY = 'simag_dummy_data_v3';
  const LEGACY_KEY = 'simag_mitra_data_v1';

  const defaultData = {
    people: {
      student: {
        id: 'raka-aditya',
        initials: 'RA',
        name: 'Raka Aditya',
        nim: '23.11.5508',
        studyProgram: 'S1 Informatika',
        semester: 6
      },
      lecturer: {
        id: 'ahmad-fauzi',
        initials: 'AF',
        name: 'Dr. Ahmad Fauzi',
        faculty: 'Fakultas Ilmu Komputer'
      },
      admin: {
        id: 'admin-prodi',
        initials: 'AP',
        name: 'Admin Prodi FIKOM'
      },
      company: {
        id: 'bank-mandiri',
        initials: 'BM',
        name: 'PT Bank Mandiri (Persero) Tbk',
        shortName: 'PT Bank Mandiri',
        email: 'hr@bankmandiri.co.id',
        website: 'https://bankmandiri.co.id',
        industry: 'Perbankan dan Keuangan',
        address: 'Plaza Mandiri, Jl. Jend. Gatot Subroto Kav. 36-38, Jakarta 12190',
        location: 'Jakarta Pusat',
        tagline: 'Perbankan & Keuangan Terbesar di Indonesia',
        logo: ''
      }
    },
    applications: [
      {
        id: 'app-raka-mandiri',
        studentId: 'raka-aditya',
        vacancyId: 'backend-developer',
        companyId: 'bank-mandiri',
        lecturerId: 'ahmad-fauzi',
        position: 'Software Engineer Intern',
        adminStatus: 'Approved',
        partnerStatus: 'Accepted',
        status: 'Accepted',
        submittedAt: '2026-06-01T08:15:00.000Z',
        approvedAt: '2026-06-02T09:00:00.000Z',
        acceptedAt: '2026-06-03T10:30:00.000Z'
      },
      {
        id: 'app-nadia-mandiri',
        studentId: 'nadia-rahma',
        vacancyId: 'data-analyst',
        companyId: 'bank-mandiri',
        lecturerId: 'ahmad-fauzi',
        name: 'Nadia Rahma',
        initials: 'NR',
        nim: '23.11.5510',
        studyProgram: 'S1 Informatika',
        position: 'Data Analyst Intern',
        adminStatus: 'Pending',
        partnerStatus: 'Waiting',
        status: 'Pending',
        submittedAt: '2026-06-12T06:20:00.000Z'
      }
    ],
    interns: [
      {
        id: 'raka-aditya',
        initials: 'RA',
        name: 'Raka Aditya',
        nim: '23.11.5508',
        institution: 'S1 Informatika - Universitas Amikom Yogyakarta',
        studyProgram: 'S1 Informatika',
        companyId: 'bank-mandiri',
        company: 'PT Bank Mandiri (Persero) Tbk',
        lecturerId: 'ahmad-fauzi',
        lecturer: 'Dr. Ahmad Fauzi',
        position: 'Software Engineer Intern',
        status: 'Accepted',
        progress: 87,
        logbookCompleted: 131,
        logbookTarget: 150,
        period: '1 Feb 2026 - 31 Jul 2026',
        startDate: '2026-02-01',
        endDate: '2026-07-31',
        mentor: 'Budi Santoso',
        attendance: '68 / 72 Hari',
        logbookWeek: 'Minggu ke-19'
      }
    ],
    logbooks: [
      {
        id: 'log-raka-spring-boot',
        internId: 'raka-aditya',
        date: '2026-06-13',
        startTime: '09:00',
        endTime: '16:00',
        title: 'Implementasi REST API dengan Spring Boot',
        activity: 'Implementasi REST API dengan Spring Boot',
        description: 'Membuat endpoint REST untuk modul pendaftaran magang, validasi request, dan response standar menggunakan Spring Boot.',
        result: 'Endpoint pendaftaran, detail lowongan, dan status approval selesai diuji dengan data dummy.',
        obstacle: 'Perlu penyesuaian struktur DTO agar konsisten dengan kebutuhan dashboard SIMAG.',
        status: 'submitted',
        note: '',
        submittedAt: '2026-06-13T09:00:00.000Z',
        reviewer: ''
      },
      {
        id: 'log-raka-review-code',
        internId: 'raka-aditya',
        date: '2026-06-12',
        startTime: '10:00',
        endTime: '15:30',
        title: 'Review Kode Modul Authentication',
        activity: 'Review Kode Modul Authentication',
        description: 'Melakukan review kode login dan role guard bersama mentor perusahaan.',
        result: 'Alur autentikasi demo sudah terdokumentasi dan siap disambungkan ke backend.',
        obstacle: '',
        status: 'approved',
        note: 'Disetujui oleh Dr. Ahmad Fauzi.',
        submittedAt: '2026-06-12T08:00:00.000Z',
        reviewedAt: '2026-06-12T13:30:00.000Z',
        reviewer: 'Dr. Ahmad Fauzi'
      }
    ],
    vacancies: [
      {
        id: 'backend-developer',
        title: 'Backend Developer Intern',
        companyId: 'bank-mandiri',
        company: 'PT Bank Mandiri (Persero) Tbk',
        location: 'Jakarta Pusat',
        workModel: 'Hybrid',
        quota: 3,
        deadline: '2026-08-15',
        status: 'active',
        badge: 'Sesuai Jurusan',
        description: 'Bergabung dengan tim engineering untuk membangun layanan internal berbasis REST API dan integrasi data.',
        responsibilities: [
          'Membangun REST API dengan Java Spring Boot',
          'Menyusun dokumentasi endpoint dan skenario pengujian',
          'Berkolaborasi dengan mentor untuk code review mingguan'
        ],
        qualifications: [
          'Mahasiswa aktif S1 Informatika minimal semester 5',
          'Memahami Java, SQL, Git, dan konsep REST API',
          'Teliti dalam dokumentasi dan pengujian endpoint'
        ]
      },
      {
        id: 'data-analyst',
        title: 'Data Analyst Intern',
        companyId: 'bank-mandiri',
        company: 'PT Bank Mandiri (Persero) Tbk',
        location: 'Jakarta Pusat',
        workModel: 'WFO',
        quota: 2,
        deadline: '2026-07-30',
        status: 'active',
        badge: 'Terbuka',
        description: 'Membantu tim data menyiapkan dashboard analitik operasional berbasis laporan internal.',
        responsibilities: [
          'Membersihkan data operasional dan membuat visualisasi',
          'Menyusun insight mingguan untuk stakeholder',
          'Membantu automasi laporan berkala'
        ],
        qualifications: [
          'Menguasai spreadsheet, SQL dasar, dan Python menjadi nilai tambah',
          'Mampu membaca data dan menulis insight ringkas',
          'Bersedia mengikuti pola kerja WFO'
        ]
      }
    ],
    applicants: [
      {
        id: 'applicant-raka',
        studentId: 'raka-aditya',
        vacancyId: 'backend-developer',
        name: 'Raka Aditya',
        nim: '23.11.5508',
        studyProgram: 'S1 Informatika',
        semester: 6,
        gpa: '3.86',
        skills: ['Java', 'Spring Boot', 'REST API'],
        status: 'Diterima'
      },
      {
        id: 'applicant-nadia',
        studentId: 'nadia-rahma',
        vacancyId: 'data-analyst',
        name: 'Nadia Rahma',
        nim: '23.11.5510',
        studyProgram: 'S1 Informatika',
        semester: 6,
        gpa: '3.82',
        skills: ['Python', 'SQL', 'Power BI'],
        status: 'Menunggu'
      }
    ],
    evaluations: [
      {
        id: 'evaluation-raka',
        candidateId: 'raka-aditya',
        scores: {
          technical: 90,
          communication: 88,
          discipline: 95,
          teamwork: 92
        },
        finalScore: 91,
        grade: 'A-',
        notes: 'Kinerja teknis kuat, komunikasi baik, dan disiplin sangat konsisten.',
        submittedAt: '2026-06-13T10:00:00.000Z'
      }
    ],
    sksConversions: [
      {
        id: 'sks-raka',
        studentId: 'raka-aditya',
        sks: 20,
        target: 20,
        status: 'Completed',
        convertedAt: '2026-06-13T11:00:00.000Z'
      }
    ],
    activities: [
      {
        id: 'act-log-submitted',
        type: 'logbook',
        title: 'Raka Aditya mengirim logbook Implementasi REST API dengan Spring Boot',
        meta: 'Hari ini - status Submitted',
        icon: 'LB',
        at: '2026-06-13T09:00:00.000Z'
      },
      {
        id: 'act-app-approved',
        type: 'approval',
        title: 'Pendaftaran Raka Aditya disetujui Admin Prodi',
        meta: 'PT Bank Mandiri (Persero) Tbk - status Approved',
        icon: 'AP',
        at: '2026-06-13T08:30:00.000Z'
      },
      {
        id: 'act-sks-completed',
        type: 'sks',
        title: 'Konversi SKS Raka Aditya selesai',
        meta: '20 SKS - status Completed',
        icon: 'SK',
        at: '2026-06-13T08:00:00.000Z'
      }
    ],
    companyProfile: {
      name: 'PT Bank Mandiri (Persero) Tbk',
      email: 'hr@bankmandiri.co.id',
      website: 'https://bankmandiri.co.id',
      address: 'Plaza Mandiri, Jl. Jend. Gatot Subroto Kav. 36-38, Jakarta 12190',
      tagline: 'Perbankan & Keuangan Terbesar di Indonesia',
      logo: ''
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeData(data) {
    const normalized = {
      ...clone(defaultData),
      ...(data || {})
    };

    normalized.people = {
      ...clone(defaultData.people),
      ...(data && data.people ? data.people : {})
    };

    normalized.companyProfile = {
      ...clone(defaultData.companyProfile),
      ...(data && data.companyProfile ? data.companyProfile : {})
    };

    [
      'applications',
      'interns',
      'logbooks',
      'vacancies',
      'applicants',
      'evaluations',
      'sksConversions',
      'activities'
    ].forEach((key) => {
      if (!Array.isArray(normalized[key])) normalized[key] = clone(defaultData[key]);
    });

    normalized.interns.forEach((intern) => {
      const application = normalized.applications.find((item) => item.studentId === intern.id);
      if (application && application.status) intern.status = application.status;
    });

    return normalized;
  }

  function read() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') return normalizeData(saved);
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }

    const initialData = normalizeData(null);

    try {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
      if (legacy && typeof legacy === 'object') {
        if (Array.isArray(legacy.vacancies) && legacy.vacancies.length) {
          initialData.vacancies = legacy.vacancies.map((vacancy) => ({
            ...vacancy,
            companyId: 'bank-mandiri',
            company: defaultData.people.company.name
          }));
        }
        if (legacy.companyProfile) {
          initialData.companyProfile = {
            ...initialData.companyProfile,
            ...legacy.companyProfile,
            name: legacy.companyProfile.name || initialData.companyProfile.name
          };
          initialData.people.company.name = initialData.companyProfile.name;
        }
      }
    } catch (error) {
      localStorage.removeItem(LEGACY_KEY);
    }

    write(initialData);
    return initialData;
  }

  function write(data) {
    const normalized = normalizeData(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function addActivity(data, activity) {
    data.activities.unshift({
      id: activity.id || `activity-${Date.now()}`,
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
    return data.people.student;
  }

  function getPrimaryIntern(data) {
    return data.interns.find((intern) => intern.id === data.people.student.id) || data.interns[0];
  }

  function initialsFromName(name) {
    return String(name)
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
    if (status === 'approved' || status === 'Approved' || status === 'Accepted' || status === 'Completed') return 'badge-success';
    if (status === 'revision' || status === 'Revision' || status === 'Pending' || status === 'Waiting' || status === 'Menunggu' || status === 'Diproses' || status === 'Perlu Review') return 'badge-warning';
    if (status === 'Rejected' || status === 'Ditolak' || status === 'rejected') return 'badge-danger';
    return 'badge-info';
  }

  function getLatestLogbookForIntern(data, internId) {
    return data.logbooks
      .filter((logbook) => logbook.internId === internId)
      .sort((a, b) => new Date(b.submittedAt || b.date) - new Date(a.submittedAt || a.date))[0] || null;
  }

  function recalculateIntern(data, internId) {
    const intern = data.interns.find((item) => item.id === internId);
    if (!intern) return;

    const internLogbooks = data.logbooks.filter((item) => item.internId === internId);
    const application = data.applications.find((item) => item.studentId === internId);
    intern.status = application ? application.status : intern.status;
    intern.logbookCompleted = Math.max(intern.logbookCompleted || 0, internLogbooks.length);
  }

  function addLogbook(logbook) {
    const data = read();
    const intern = getPrimaryIntern(data);
    const title = logbook.title || logbook.activity || 'Logbook Magang';
    const savedLogbook = {
      id: logbook.id || `log-${Date.now()}`,
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
    write(data);
    return clone(savedLogbook);
  }

  function updateLogbook(logbookId, changes) {
    const data = read();
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

    write(data);
    return clone(updatedLogbook);
  }

  function updateCollection(collectionName, itemId, changes) {
    const data = read();
    const collection = data[collectionName] || [];
    const itemIndex = collection.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) return null;

    collection[itemIndex] = { ...collection[itemIndex], ...changes };
    write(data);
    return clone(collection[itemIndex]);
  }

  function addVacancy(vacancy) {
    const data = read();
    data.vacancies.unshift({
      id: vacancy.id || `vacancy-${Date.now()}`,
      title: vacancy.title,
      companyId: 'bank-mandiri',
      company: data.people.company.name,
      location: vacancy.location,
      workModel: vacancy.workModel,
      quota: Number(vacancy.quota),
      deadline: vacancy.deadline,
      description: vacancy.description || '',
      qualifications: vacancy.qualifications || '',
      responsibilities: vacancy.responsibilities || [],
      status: 'active',
      badge: 'Terbuka'
    });
    addActivity(data, {
      type: 'vacancy',
      title: `${data.people.company.shortName} membuka lowongan ${vacancy.title}`,
      meta: `${vacancy.location} - ${vacancy.workModel}`,
      icon: 'LW'
    });
    write(data);
    return clone(data.vacancies[0]);
  }

  function updateApplicant(id, changes) {
    const data = read();
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

    write(data);
    return clone(applicant);
  }

  function approveApplication(applicationId) {
    const data = read();
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
    write(data);
    return clone(application);
  }

  function applyVacancy(vacancyId) {
    const data = read();
    const student = data.people.student;
    const vacancy = data.vacancies.find((item) => item.id === vacancyId) || data.vacancies[0];
    const existingApplication = data.applications.find(
      (item) => item.studentId === student.id && item.vacancyId === vacancy.id
    );

    if (existingApplication) return clone(existingApplication);

    const application = {
      id: `app-${student.id}-${Date.now()}`,
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
      id: `applicant-${student.id}-${Date.now()}`,
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
    write(data);
    return clone(application);
  }

  function convertSks(studentId, sks) {
    const data = read();
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
    write(data);
    return clone(nextConversion);
  }

  function saveEvaluation(evaluation) {
    const data = read();
    const existingIndex = data.evaluations.findIndex(
      (item) => item.candidateId === evaluation.candidateId
    );
    const scoreValues = Object.values(evaluation.scores || {}).map(Number).filter(Number.isFinite);
    const finalScore = evaluation.finalScore || (
      scoreValues.length ? Math.round(scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length) : 0
    );
    const savedEvaluation = {
      ...evaluation,
      id: existingIndex >= 0 ? data.evaluations[existingIndex].id : `evaluation-${Date.now()}`,
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
    write(data);
    return clone(savedEvaluation);
  }

  function getPendingLogbookForIntern(internId) {
    return read().logbooks.find(
      (logbook) => logbook.internId === internId && ['submitted', 'pending', 'revision'].includes(logbook.status)
    ) || null;
  }

  function saveCompanyProfile(changes) {
    const data = read();
    data.companyProfile = { ...data.companyProfile, ...changes };
    data.people.company.name = data.companyProfile.name;
    data.people.company.shortName = data.companyProfile.name.replace(' (Persero) Tbk', '');
    data.people.company.email = data.companyProfile.email;
    data.people.company.website = data.companyProfile.website;
    data.people.company.address = data.companyProfile.address;
    data.people.company.tagline = data.companyProfile.tagline;
    data.people.company.logo = data.companyProfile.logo;
    write(data);
    return clone(data.companyProfile);
  }

  function saveRoleProfile(role, changes) {
    const data = read();
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

    write(data);
    return clone(data.people[peopleKey]);
  }

  function getEvaluationCandidates() {
    const data = read();
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

  function getDashboardSummary() {
    const data = read();
    const intern = getPrimaryIntern(data);
    const logbooks = data.logbooks.filter((item) => item.internId === intern.id);
    const submittedLogbooks = logbooks.filter((item) => ['submitted', 'pending'].includes(item.status));
    const revisionLogbooks = logbooks.filter((item) => item.status === 'revision');
    const evaluation = data.evaluations.find((item) => item.candidateId === intern.id) || null;
    const sks = data.sksConversions.find((item) => item.studentId === intern.id) || { sks: 0, target: 20, status: 'Pending' };
    const application = data.applications.find((item) => item.studentId === intern.id) || null;

    return clone({
      student: data.people.student,
      lecturer: data.people.lecturer,
      company: data.people.company,
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

  function syncSidebarBadges() {
    const data = read();
    const pendingCount = data.logbooks.filter((item) => ['submitted', 'pending'].includes(item.status)).length;
    const actionCount = data.logbooks.filter((item) => ['submitted', 'pending', 'revision'].includes(item.status)).length;
    document.querySelectorAll('.sidebar-item').forEach((item) => {
      const badge = item.querySelector('.badge');
      if (!badge) return;
      const label = item.textContent.replace(/\d+/g, '').trim();
      if (label.includes('Intern Aktif')) badge.textContent = data.interns.length;
      if (label.includes('Review Logbook') || label.includes('Monitoring Logbook')) badge.textContent = pendingCount;
      if (label.includes('Logbook Saya')) badge.textContent = actionCount;
    });
  }

  function getData() {
    return clone(read());
  }

  const api = {
    getData,
    getDashboardSummary,
    getStudent: () => clone(read().people.student),
    getLecturer: () => clone(read().people.lecturer),
    getCompany: () => clone(read().people.company),
    getInterns: () => clone(read().interns),
    getIntern: (id) => clone(read().interns.find((item) => item.id === id) || null),
    getLogbooks: () => clone(read().logbooks),
    getLogbook: (id) => clone(read().logbooks.find((item) => item.id === id) || null),
    getLatestLogbookForIntern: (internId) => clone(getLatestLogbookForIntern(read(), internId)),
    getPendingLogbookForIntern: (internId) => clone(getPendingLogbookForIntern(internId)),
    addLogbook,
    updateLogbook,
    approveLogbook: (id) => {
      const lecturer = read().people.lecturer;
      return updateLogbook(id, {
        status: 'approved',
        note: `Disetujui oleh ${lecturer.name}.`,
        reviewer: lecturer.name
      });
    },
    requestLogbookRevision: (id, note) => {
      const lecturer = read().people.lecturer;
      return updateLogbook(id, { status: 'revision', note, reviewer: lecturer.name });
    },
    getVacancies: () => clone(read().vacancies),
    getVacancy: (id) => clone(read().vacancies.find((item) => item.id === id) || null),
    addVacancy,
    updateVacancy: (id, changes) => updateCollection('vacancies', id, changes),
    getApplicants: (vacancyId) => clone(
      read().applicants.filter((item) => !vacancyId || item.vacancyId === vacancyId)
    ),
    getApplicant: (id) => clone(read().applicants.find((item) => item.id === id) || null),
    updateApplicant,
    getApplications: () => clone(read().applications),
    applyVacancy,
    approveApplication,
    convertSks,
    getEvaluationCandidates: () => clone(getEvaluationCandidates()),
    getEvaluations: () => clone(read().evaluations),
    getEvaluation: (candidateId) => clone(
      read().evaluations.find((item) => item.candidateId === candidateId) || null
    ),
    saveEvaluation,
    getSksConversions: () => clone(read().sksConversions),
    getCompanyProfile: () => clone(read().companyProfile),
    saveCompanyProfile,
    saveRoleProfile,
    getRecentActivities: () => clone(read().activities),
    statusLabel,
    statusBadge,
    syncSidebarBadges
  };

  global.SIMAG_DATA = api;
  global.SIMAG_MITRA = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncSidebarBadges);
  } else {
    syncSidebarBadges();
  }
})(window);
