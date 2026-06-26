'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { defaultData } = require('./seed');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'simag-db.json');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
  }
}

function normalizeData(data) {
  const source = data && typeof data === 'object' ? data : {};
  const normalized = {
    ...clone(defaultData),
    ...source
  };

  normalized.people = {
    ...clone(defaultData.people),
    ...(source.people || {})
  };

  normalized.companyProfile = {
    ...clone(defaultData.companyProfile),
    ...(source.companyProfile || {})
  };

  [
    'applications',
    'interns',
    'logbooks',
    'vacancies',
    'applicants',
    'evaluations',
    'sksConversions',
    'activities',
    'users'
  ].forEach((key) => {
    if (!Array.isArray(normalized[key])) normalized[key] = clone(defaultData[key] || []);
  });

  normalized.interns.forEach((intern) => {
    const application = normalized.applications.find((item) => item.studentId === intern.id);
    if (application && application.status) intern.status = application.status;
  });

  return normalized;
}

function readData() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return normalizeData(JSON.parse(raw));
  } catch (error) {
    const backupFile = path.join(DATA_DIR, `simag-db-corrupt-${Date.now()}.json`);
    if (fs.existsSync(DATA_FILE)) fs.copyFileSync(DATA_FILE, backupFile);
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    return clone(defaultData);
  }
}

function writeData(data) {
  ensureDataFile();
  const normalized = normalizeData(data);
  fs.writeFileSync(DATA_FILE, JSON.stringify(normalized, null, 2));
  return clone(normalized);
}

function resetData() {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
  return clone(defaultData);
}

function updateData(mutator) {
  const data = readData();
  const result = mutator(data);
  writeData(data);
  return clone(result);
}

module.exports = {
  clone,
  readData,
  writeData,
  resetData,
  updateData
};
