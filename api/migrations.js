const pool = require('./db');

async function migrate() {
  console.log('Adding indexes to database for query performance optimization...');
  
  const queries = [
    'CREATE INDEX idx_users_role ON users(role)',
    'CREATE INDEX idx_vacancies_company ON vacancies(company_id)',
    'CREATE INDEX idx_applicants_student ON applicants(student_id)',
    'CREATE INDEX idx_applicants_vacancy ON applicants(vacancy_id)',
    'CREATE INDEX idx_applications_student ON applications(student_id)',
    'CREATE INDEX idx_applications_vacancy ON applications(vacancy_id)',
    'CREATE INDEX idx_applications_company ON applications(company_id)',
    'CREATE INDEX idx_applications_lecturer ON applications(lecturer_id)',
    'CREATE INDEX idx_interns_company ON interns(company_id)',
    'CREATE INDEX idx_interns_lecturer ON interns(lecturer_id)',
    'CREATE INDEX idx_logbooks_intern ON logbooks(intern_id)',
    'CREATE INDEX idx_evaluations_candidate ON evaluations(candidate_id)',
    'CREATE INDEX idx_sks_student ON sks_conversions(student_id)'
  ];
  
  let added = 0;
  for (const q of queries) {
    try {
      await pool.query(q);
      added++;
      console.log('Executed:', q);
    } catch(e) {
      if (e.code !== 'ER_DUP_KEYNAME') {
        console.log('Failed:', q, e.message);
      }
    }
  }
  
  console.log(`Migration completed. Added ${added} new indexes.`);
  process.exit(0);
}

migrate().catch(e => {
  console.error(e);
  process.exit(1);
});
