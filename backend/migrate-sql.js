const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  console.log('Menghubungkan ke MySQL...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true // Allow executing multiple queries from schema.sql
  });

  try {
    console.log('Membuat database simag_db (jika belum ada)...');
    await connection.query('CREATE DATABASE IF NOT EXISTS `simag_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    await connection.query('USE `simag_db`;');

    console.log('Membaca schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Mengeksekusi schema.sql...');
    await connection.query(schemaSql);

    console.log('Schema berhasil dibuat!');

    console.log('Memasukkan data dummy (seeding)...');

    // Seed Users
    const users = [
      ['user-1', 'mahasiswa', '22.11.0987', 'xin123', 'Xin', 'mahasiswa-1781368597309-8016e0'],
      ['user-2', 'dospem', '99876', 'gon123', 'Gon.S.IT', 'dospem-1781375261814-c42587'],
      ['user-3', 'adminprodi', 'adminit', 'it1234', 'PRODI IT', 'adminprodi-1781370990009-98e4c2'],
      ['user-4', 'mitra', 'shp@gmail.com', 'shp123', 'Shopee', 'mitra-1781371482888-6bf697'],
      ['user-demo-mahasiswa', 'mahasiswa', '23.11.5508', 'budi1234', 'Budi Santoso', 'mahasiswa-demo'],
      ['user-demo-dospem', 'dospem', '19800101', 'dosen123', 'Dosen Pembimbing Demo', 'dospem-demo'],
      ['user-demo-admin', 'adminprodi', 'adminprodi', 'admin123', 'Admin Prodi Demo', 'admin-demo'],
      ['user-demo-mitra', 'mitra', 'hr@mitrademo.com', 'mitra123', 'TechCorp Indonesia', 'mitra-demo']
    ];

    for (const u of users) {
      await connection.query('INSERT IGNORE INTO users (id, role, identifier, password, name, linked_id) VALUES (?, ?, ?, ?, ?, ?)', u);
    }

    // Seed Vacancies
    const vacancies = [
      [
        'vacancy-demo-frontend',
        'Frontend Developer Intern',
        'mitra-demo',
        'TechCorp Indonesia',
        'Yogyakarta',
        'Hybrid',
        3,
        '2026-08-15',
        'Membantu pengembangan antarmuka SIMAG dan dashboard operasional.',
        JSON.stringify(['Memahami HTML, CSS, dan JavaScript', 'Terbiasa membuat UI responsif', 'Mampu bekerja dalam tim']),
        JSON.stringify(['Membuat komponen frontend', 'Memperbaiki bug UI', 'Membantu dokumentasi fitur']),
        'active',
        'Terbuka'
      ],
      [
        'vacancy-demo-uiux',
        'UI/UX Designer Intern',
        'mitra-demo',
        'TechCorp Indonesia',
        'Remote',
        'WFH',
        2,
        '2026-08-30',
        'Membantu riset pengguna dan desain pengalaman dashboard magang.',
        JSON.stringify(['Memahami Figma', 'Peka terhadap detail visual', 'Bisa membuat prototype sederhana']),
        JSON.stringify(['Membuat wireframe', 'Menyusun design handoff', 'Menguji alur pengguna']),
        'active',
        'Terbuka'
      ]
    ];

    for (const vacancy of vacancies) {
      await connection.query(
        `INSERT IGNORE INTO vacancies
         (id, title, company_id, company, location, work_model, quota, deadline, description, qualifications, responsibilities, status, badge)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        vacancy
      );
    }

    // Seed Applications and Applicants
    await connection.query(
      `INSERT IGNORE INTO applications
       (id, student_id, vacancy_id, company_id, lecturer_id, position, admin_status, partner_status, status, submitted_at, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'application-demo-mahasiswa',
        'mahasiswa-demo',
        'vacancy-demo-frontend',
        'mitra-demo',
        'dospem-demo',
        'Frontend Developer Intern',
        'Approved',
        'Accepted',
        'Accepted',
        '2026-06-10T09:00:00.000Z',
        '2026-06-11T10:00:00.000Z',

        'application-demo-xin',
        'mahasiswa-1781368597309-8016e0',
        'vacancy-demo-uiux',
        'mitra-demo',
        'dospem-demo',
        'UI/UX Designer Intern',
        'Pending',
        'Waiting',
        'Pending',
        '2026-06-22T08:00:00.000Z',
        null
      ]
    );

    await connection.query(
      `INSERT IGNORE INTO applicants
       (id, student_id, vacancy_id, name, nim, study_program, semester, gpa, skills, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'applicant-demo-mahasiswa',
        'mahasiswa-demo',
        'vacancy-demo-frontend',
        'Budi Santoso',
        '23.11.5508',
        'S1 Informatika',
        6,
        '3.82',
        JSON.stringify(['JavaScript', 'UI Design', 'Git']),
        'Diterima',

        'applicant-demo-xin',
        'mahasiswa-1781368597309-8016e0',
        'vacancy-demo-uiux',
        'Xin',
        '22.11.0987',
        'S1 Informatika',
        6,
        '3.90',
        JSON.stringify(['Figma', 'Prototyping', 'User Research']),
        'Menunggu'
      ]
    );

    // Seed Interns
    await connection.query(
      `INSERT IGNORE INTO interns
       (id, initials, name, nim, institution, study_program, company_id, company, lecturer_id, lecturer, position, status, progress, logbook_completed, logbook_target, period, start_date, end_date, mentor, attendance, logbook_week)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'mahasiswa-demo',
        'MD',
        'Budi Santoso',
        '23.11.5508',
        'Universitas Amikom Yogyakarta',
        'S1 Informatika',
        'mitra-demo',
        'TechCorp Indonesia',
        'dospem-demo',
        'Dosen Pembimbing Demo',
        'Frontend Developer Intern',
        'Aktif',
        68,
        3,
        150,
        'Juni - Desember 2026',
        '2026-06-10',
        '2026-12-10',
        'Mentor Demo',
        '96%',
        'Minggu ke-3'
      ]
    );

    // Seed Logbooks
    const logbooks = [
      [
        'logbook-demo-1',
        'mahasiswa-demo',
        'Minggu 1',
        '2026-06-17',
        '09:00',
        '17:00',
        'Setup Project Frontend',
        'Clone repository, install dependency, dan memetakan struktur halaman.',
        'Mempelajari struktur SIMAG dan menyiapkan environment lokal.',
        'Project berhasil dijalankan dan halaman dashboard dapat dibuka.',
        'Butuh sinkronisasi database lokal.',
        'approved',
        'Sudah baik.',
        '2026-06-17T17:05:00.000Z',
        '2026-06-18T09:30:00.000Z',
        'Dosen Pembimbing Demo'
      ],
      [
        'logbook-demo-2',
        'mahasiswa-demo',
        'Minggu 2',
        '2026-06-20',
        '09:00',
        '17:00',
        'Perbaikan Dashboard',
        'Menguji alur dashboard mahasiswa, mitra, admin, dan dospem.',
        'Membuat catatan bug dan memperbaiki mapping data API.',
        'Dashboard lebih stabil untuk data demo.',
        'Perlu validasi akhir lintas role.',
        'approved',
        'Terus tingkatkan testing.',
        '2026-06-20T17:10:00.000Z',
        '2026-06-21T08:00:00.000Z',
        'Dosen Pembimbing Demo'
      ],
      [
        'logbook-demo-3',
        'mahasiswa-demo',
        'Minggu 3',
        '2026-06-22',
        '08:00',
        '16:00',
        'Implementasi Real-time Sync',
        'Membuat seed data dan menguji login otomatis.',
        'Mengatasi masalah state dan ID sync untuk simulasi fitur landing.',
        'Landing page sekarang sesuai dengan data sesi yang login.',
        'Tidak ada kendala besar.',
        'submitted',
        '',
        '2026-06-22T16:05:00.000Z',
        null,
        null
      ]
    ];

    for (const logbook of logbooks) {
      await connection.query(
        `INSERT IGNORE INTO logbooks
         (id, intern_id, week, date, time_in, time_out, title, activity, description, result, obstacle, status, note, submitted_at, reviewed_at, reviewer)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), note=VALUES(note), reviewed_at=VALUES(reviewed_at), reviewer=VALUES(reviewer)`,
        logbook
      );
    }

    // Seed SKS and Evaluation
    await connection.query(
      `INSERT IGNORE INTO sks_conversions
       (id, student_id, sks, target, status, converted_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['sks-demo-mahasiswa', 'mahasiswa-demo', 12, 20, 'Completed', '2026-06-20T12:00:00.000Z']
    );

    await connection.query(
      `INSERT IGNORE INTO evaluations
       (id, candidate_id, status, grade, technical_score, communication_score, teamwork_score, discipline_score, initiative_score, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['evaluation-demo-mahasiswa', 'mahasiswa-demo', 'Completed', 'B+', 86, 84, 88, 90, 82, 'Progress baik, komunikasi aktif, dan perlu terus merapikan dokumentasi.']
    );

    // Seed Activities
    const activities = [
      ['activity-demo-1', 'application', 'Budi Santoso diterima sebagai Frontend Developer Intern', 'TechCorp Indonesia - Approved', 'AP'],
      ['activity-demo-2', 'logbook', 'Logbook Perbaikan Dashboard menunggu review', 'Budi Santoso - Minggu 2', 'LG'],
      ['activity-demo-3', 'vacancy', 'TechCorp Indonesia membuka lowongan Frontend Developer Intern', 'Yogyakarta - Hybrid', 'LW']
    ];

    for (const activity of activities) {
      await connection.query(
        'INSERT IGNORE INTO activities (id, type, title, meta, icon) VALUES (?, ?, ?, ?, ?)',
        activity
      );
    }

    console.log('Data dummy berhasil dimasukkan!');
    console.log('Migrasi selesai. Anda bisa menutup script ini.');

  } catch (error) {
    console.error('Error saat migrasi:', error);
  } finally {
    await connection.end();
  }
}

migrate();
