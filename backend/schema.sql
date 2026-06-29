DROP DATABASE IF EXISTS `simag_db`;
CREATE DATABASE IF NOT EXISTS `simag_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `simag_db`;

-- Users
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) PRIMARY KEY,
  `role` VARCHAR(20) NOT NULL,
  `identifier` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `linked_id` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_identifier_role` (`identifier`, `role`)
);

-- Vacancies
CREATE TABLE IF NOT EXISTS `vacancies` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL,
  `company_id` VARCHAR(50) NOT NULL,
  `company` VARCHAR(100) NOT NULL,
  `location` VARCHAR(100),
  `work_model` VARCHAR(50),
  `quota` INT DEFAULT 0,
  `deadline` VARCHAR(50),
  `description` TEXT,
  `qualifications` JSON,
  `responsibilities` JSON,
  `status` VARCHAR(20) DEFAULT 'active',
  `badge` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applicants (Data pelamar detail)
CREATE TABLE IF NOT EXISTS `applicants` (
  `id` VARCHAR(50) PRIMARY KEY,
  `student_id` VARCHAR(50) NOT NULL,
  `vacancy_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100),
  `nim` VARCHAR(50),
  `study_program` VARCHAR(100),
  `semester` INT,
  `gpa` VARCHAR(10),
  `skills` JSON,
  `cv_file_id` VARCHAR(50),
  `cv_details_id` VARCHAR(50),
  `status` VARCHAR(50) DEFAULT 'Menunggu',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications (Data pengajuan)
CREATE TABLE IF NOT EXISTS `applications` (
  `id` VARCHAR(50) PRIMARY KEY,
  `student_id` VARCHAR(50) NOT NULL,
  `vacancy_id` VARCHAR(50) NOT NULL,
  `company_id` VARCHAR(50),
  `lecturer_id` VARCHAR(50),
  `position` VARCHAR(100),
  `admin_status` VARCHAR(50) DEFAULT 'Pending',
  `partner_status` VARCHAR(50) DEFAULT 'Waiting',
  `status` VARCHAR(50) DEFAULT 'Pending',
  `submitted_at` VARCHAR(50),
  `approved_at` VARCHAR(50)
);

-- Interns (Peserta magang aktif)
CREATE TABLE IF NOT EXISTS `interns` (
  `id` VARCHAR(50) PRIMARY KEY,
  `initials` VARCHAR(10),
  `name` VARCHAR(100),
  `nim` VARCHAR(50),
  `institution` VARCHAR(200),
  `study_program` VARCHAR(100),
  `company_id` VARCHAR(50),
  `company` VARCHAR(100),
  `lecturer_id` VARCHAR(50),
  `lecturer` VARCHAR(100),
  `position` VARCHAR(100),
  `status` VARCHAR(50),
  `progress` INT DEFAULT 0,
  `logbook_completed` INT DEFAULT 0,
  `logbook_target` INT DEFAULT 150,
  `period` VARCHAR(100),
  `start_date` VARCHAR(50),
  `end_date` VARCHAR(50),
  `mentor` VARCHAR(100),
  `attendance` VARCHAR(50),
  `logbook_week` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logbooks
CREATE TABLE IF NOT EXISTS `logbooks` (
  `id` VARCHAR(50) PRIMARY KEY,
  `intern_id` VARCHAR(50) NOT NULL,
  `week` VARCHAR(50),
  `date` VARCHAR(50),
  `time_in` VARCHAR(10),
  `time_out` VARCHAR(10),
  `title` VARCHAR(255),
  `activity` VARCHAR(255),
  `description` TEXT,
  `result` TEXT,
  `obstacle` TEXT,
  `status` VARCHAR(50) DEFAULT 'submitted',
  `note` TEXT,
  `submitted_at` VARCHAR(50),
  `reviewed_at` VARCHAR(50),
  `reviewer` VARCHAR(100)
);

-- Activities
CREATE TABLE IF NOT EXISTS `activities` (
  `id` VARCHAR(50) PRIMARY KEY,
  `type` VARCHAR(50),
  `title` VARCHAR(255),
  `meta` VARCHAR(255),
  `icon` VARCHAR(10),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SKS Conversions
CREATE TABLE IF NOT EXISTS `sks_conversions` (
  `id` VARCHAR(50) PRIMARY KEY,
  `student_id` VARCHAR(50) NOT NULL,
  `sks` INT DEFAULT 0,
  `target` INT DEFAULT 20,
  `status` VARCHAR(50) DEFAULT 'Completed',
  `converted_at` VARCHAR(50)
);

-- Evaluations
CREATE TABLE IF NOT EXISTS `evaluations` (
  `id` VARCHAR(50) PRIMARY KEY,
  `candidate_id` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'Completed',
  `grade` VARCHAR(10),
  `technical_score` INT DEFAULT 0,
  `communication_score` INT DEFAULT 0,
  `teamwork_score` INT DEFAULT 0,
  `discipline_score` INT DEFAULT 0,
  `initiative_score` INT DEFAULT 0,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CV Files
CREATE TABLE IF NOT EXISTS `cv_files` (
  `id` VARCHAR(50) PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `file_type` VARCHAR(50),
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- CV Details
CREATE TABLE IF NOT EXISTS `cv_details` (
  `id` VARCHAR(50) PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `work_experience` JSON,
  `skills` JSON,
  `portfolio_links` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Vacancy Requirements
CREATE TABLE IF NOT EXISTS `vacancy_requirements` (
  `id` VARCHAR(50) PRIMARY KEY,
  `vacancy_id` VARCHAR(50) NOT NULL,
  `min_gpa` VARCHAR(10),
  `required_skills` JSON,
  `required_semester` INT,
  `custom_questions` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Application Reviews
CREATE TABLE IF NOT EXISTS `application_reviews` (
  `id` VARCHAR(50) PRIMARY KEY,
  `application_id` VARCHAR(50) NOT NULL,
  `reviewer_type` VARCHAR(20) NOT NULL,
  `status` VARCHAR(20) DEFAULT 'pending',
  `feedback` TEXT,
  `reviewed_at` TIMESTAMP NULL
);
