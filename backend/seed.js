const pool = require('./db');

async function seed() {
  console.log('Seeding demo accounts to MySQL database...');

  try {
    console.log('Menghapus data lama...');
    await pool.query('DELETE FROM activities');
    await pool.query('DELETE FROM sks_conversions');
    await pool.query('DELETE FROM evaluations');
    await pool.query('DELETE FROM logbooks');
    await pool.query('DELETE FROM interns');
    await pool.query('DELETE FROM applications');
    await pool.query('DELETE FROM applicants');
    await pool.query('DELETE FROM vacancies');
    await pool.query('DELETE FROM users');
    
    const mahasiswaId = `mahasiswa-demo`;
    const mitraId = `mitra-demo`;
    const adminId = `admin-demo`;
    const dospemId = `dospem-demo`;
    const vacancyId = `vacancy-demo-frontend`;
    const applicationId = `application-demo-mahasiswa`;
    const applicantId = `applicant-demo-mahasiswa`;
    const logbookId1 = `logbook-demo-1`;
    const logbookId2 = `logbook-demo-2`;
    const logbookId3 = `logbook-demo-3`;

    console.log('Membuat akun (Password 6 karakter)...');
    await pool.query(`INSERT INTO users (id, role, identifier, password, name, linked_id) VALUES 
      (?, 'mahasiswa', '23.11.5508', 'budi1234', 'Mahasiswa Demo', ?),
      (?, 'mitra', 'hr@mitrademo.com', 'mitra123', 'Mitra Demo', ?),
      (?, 'adminprodi', 'adminprodi', 'admin123', 'Admin Prodi Demo', ?),
      (?, 'dospem', '19800101', 'dosen123', 'Dosen Pembimbing Demo', ?)
    `, [
      `user-${mahasiswaId}`, mahasiswaId,
      `user-${mitraId}`, mitraId,
      `user-${adminId}`, adminId,
      `user-${dospemId}`, dospemId
    ]);

    console.log('Membuat lowongan...');
    await pool.query(`INSERT INTO vacancies (id, title, company_id, company, location, work_model, quota, deadline, description, status, badge) VALUES 
      (?, 'Frontend Developer Intern', ?, 'Mitra Demo', 'Yogyakarta', 'Hybrid', 3, '2026-08-15', 'Membantu pengembangan antarmuka SIMAG dan dashboard operasional.', 'active', 'Terbuka'),
      (?, 'UI/UX Designer Intern', ?, 'Mitra Demo', 'Remote', 'WFH', 2, '2026-08-30', 'Membantu riset pengguna dan desain pengalaman dashboard magang.', 'active', 'Terbuka')
    `, [vacancyId, mitraId, `vacancy-demo-uiux`, mitraId]);

    console.log('Membuat pendaftaran...');
    await pool.query(`INSERT INTO applications (id, student_id, vacancy_id, company_id, lecturer_id, position, admin_status, partner_status, status, submitted_at, approved_at) VALUES 
      (?, ?, ?, ?, ?, 'Frontend Developer Intern', 'Approved', 'Accepted', 'Accepted', '2026-06-10 09:00:00', '2026-06-11 10:00:00')
    `, [applicationId, mahasiswaId, vacancyId, mitraId, dospemId]);

    await pool.query(`INSERT INTO applicants (id, student_id, vacancy_id, name, nim, study_program, semester, gpa, status) VALUES 
      (?, ?, ?, 'Mahasiswa Demo', '23.11.5508', 'S1 Informatika', 6, '3.82', 'Diterima')
    `, [applicantId, mahasiswaId, vacancyId]);

    console.log('Membuat data magang aktif...');
    await pool.query(`INSERT INTO interns (id, initials, name, nim, institution, study_program, company_id, company, lecturer_id, lecturer, position, status, progress, logbook_completed, logbook_target, period, start_date, end_date, mentor, attendance, logbook_week) VALUES 
      (?, 'MD', 'Mahasiswa Demo', '23.11.5508', 'S1 Informatika - Universitas Amikom Yogyakarta', 'S1 Informatika', ?, 'Mitra Demo', ?, 'Dosen Pembimbing Demo', 'Frontend Developer Intern', 'Accepted', 68, 3, 150, '15 Jun 2026 - 15 Des 2026', '2026-06-15', '2026-12-15', 'Budi Santoso', '0 / 0 Hari', 'Minggu ke-3')
    `, [mahasiswaId, mitraId, dospemId]);

    console.log('Membuat logbook...');
    await pool.query(`INSERT INTO logbooks (id, intern_id, week, date, time_in, time_out, title, activity, description, result, obstacle, status, note, submitted_at, reviewed_at, reviewer) VALUES 
      (?, ?, 'Minggu 1', '2026-06-17', '09:00', '17:00', 'Setup Project Frontend', 'Setup Project Frontend', 'Clone repository, install dependency, dan memetakan struktur halaman.', 'Project berhasil dijalankan dan halaman dashboard dapat dibuka.', 'Butuh sinkronisasi database lokal.', 'approved', 'Sudah baik.', '2026-06-17 17:05:00', '2026-06-18 09:30:00', 'Dosen Pembimbing Demo'),
      (?, ?, 'Minggu 2', '2026-06-20', '09:00', '17:00', 'Perbaikan Dashboard', 'Perbaikan Dashboard', 'Menguji alur dashboard mahasiswa, mitra, admin, dan dospem.', 'Dashboard lebih stabil untuk data demo.', 'Perlu validasi akhir lintas role.', 'approved', 'Terus tingkatkan testing.', '2026-06-20 17:10:00', '2026-06-21 08:00:00', 'Dosen Pembimbing Demo'),
      (?, ?, 'Minggu 3', '2026-06-22', '08:00', '16:00', 'Implementasi Real-time Sync', 'Implementasi Real-time Sync', 'Membuat seed data dan menguji login otomatis.', 'Landing page sekarang sesuai dengan data sesi yang login.', 'Tidak ada kendala besar.', 'submitted', '', '2026-06-22 16:05:00', NULL, '')
    `, [logbookId1, mahasiswaId, logbookId2, mahasiswaId, logbookId3, mahasiswaId]);

    console.log('Membuat penilaian...');
    await pool.query(`INSERT INTO evaluations (id, candidate_id, status, grade, technical_score, communication_score, teamwork_score, discipline_score, initiative_score, notes) VALUES 
      (?, ?, 'Completed', 'B+', 85, 90, 88, 85, 82, 'Progress baik, komunikasi aktif, dan perlu terus merapikan dokumentasi.')
    `, [`eval-demo`, mahasiswaId]);

    console.log('Membuat konversi SKS...');
    await pool.query(`INSERT INTO sks_conversions (id, student_id, sks, target, status, converted_at) VALUES 
      (?, ?, 12, 20, 'Completed', '2026-06-20 12:00:00')
    `, [`sks-demo`, mahasiswaId]);

    console.log('Berhasil membuat seluruh data dummy yang saling terhubung (MySQL Mode)!');
  } catch (e) {
    console.error('Gagal melakukan seeding:', e);
  }
}

module.exports = {
  seed,
  defaultData: {}
};
