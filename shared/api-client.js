'use strict';

(async function initSimagApi(global) {
  const API_BASE_URL = 'http://localhost:3000/api';
  const GET_CACHE_TTL_MS = 5000;
  const pendingGets = new Map();

  function getSessionUserId() {
    try {
      const userStr = localStorage.getItem('simag_user') || sessionStorage.getItem('simag_user');
      if (userStr && userStr !== 'undefined') {
        const u = JSON.parse(userStr);
        if (u && u.id) return u.id;
      }
    } catch (e) {}
    return '';
  }

  function cacheKey(endpoint, userId) {
    return `simag_api_cache:${userId || 'guest'}:${endpoint}`;
  }

  function readGetCache(endpoint, userId) {
    try {
      const raw = sessionStorage.getItem(cacheKey(endpoint, userId));
      if (!raw) return null;
      const cached = JSON.parse(raw);
      if (!cached || Date.now() - cached.createdAt > GET_CACHE_TTL_MS) return null;
      return cached.data;
    } catch (e) {
      return null;
    }
  }

  function writeGetCache(endpoint, userId, data) {
    try {
      sessionStorage.setItem(cacheKey(endpoint, userId), JSON.stringify({
        createdAt: Date.now(),
        data
      }));
      
      // Compute global badges for SIMAG when '/data' is fetched
      if (endpoint === '/data' && data && data.interns && data.logbooks) {
        const badges = {};
        badges.pendingSks = data.interns.filter(i => { const c = data.sksConversions.find(s => s.studentId === i.id); return !c || c.status !== 'Completed'; }).length;
        badges.reviewLogbooks = data.logbooks.filter(l => ['submitted','pending','revision'].includes(l.status)).length;
        const evalIds = new Set(data.evaluations.map(e=>e.candidateId));
        badges.waitingEvaluations = data.interns.filter(i=>!evalIds.has(i.id)).length;
        badges.internCount = data.interns.length;
        badges.pendingLogbooks = data.logbooks.filter(l => ['submitted','pending'].includes(l.status)).length;
        localStorage.setItem('simag_badges', JSON.stringify(badges));
        if (window.simag_renderGlobalBadges) window.simag_renderGlobalBadges();
      }
    } catch (e) {}
  }


  function clearGetCache() {
    try {
      Object.keys(sessionStorage)
        .filter((key) => key.startsWith('simag_api_cache:'))
        .forEach((key) => sessionStorage.removeItem(key));
    } catch (e) {}
    pendingGets.clear();
  }

  async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('simag_token') || sessionStorage.getItem('simag_token');
    const userId = getSessionUserId();
    const method = String(options.method || 'GET').toUpperCase();
    const canCache = method === 'GET' && !options.noCache;

    if (canCache) {
      const cached = readGetCache(endpoint, userId);
      if (cached) return cached;
      const pendingKey = cacheKey(endpoint, userId);
      if (pendingGets.has(pendingKey)) return pendingGets.get(pendingKey);
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (userId) {
      headers['X-User-Id'] = userId;
    }

    const pendingKey = cacheKey(endpoint, userId);
    const request = fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    }).then(async (response) => {
      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error(`API returned invalid data format: ${response.status}`);
      }
      if (!response.ok) {
        throw new Error(data.message || `API Error: ${response.status}`);
      }
      return data;
    });

    if (!canCache) {
      clearGetCache();
      return request;
    }

    const cachedRequest = request.then((data) => {
      writeGetCache(endpoint, userId, data);
      pendingGets.delete(pendingKey);
      return data;
    }).catch((error) => {
      pendingGets.delete(pendingKey);
      throw error;
    });
    pendingGets.set(pendingKey, cachedRequest);
    return cachedRequest;
  }

  const api = {
    getData: () => apiFetch('/data'),
    getDashboardSummary: () => apiFetch('/dashboard/summary'),
    getDashboardSummaryMitra: () => apiFetch('/dashboard/summary-mitra'),
    getDashboardSummaryAdmin: () => apiFetch('/dashboard/summary-admin'),
    getDashboardSummaryDospem: () => apiFetch('/dashboard/summary-dospem'),
    getStudent: () => apiFetch('/people/student'),
    getLecturer: () => apiFetch('/people/lecturer'),
    getCompany: () => apiFetch('/people/company'),
    getInterns: () => apiFetch('/interns'),
    getIntern: (id) => apiFetch(`/interns/${id}`),
    getLogbooks: () => apiFetch('/logbooks'),
    getLogbook: (id) => apiFetch(`/logbooks/${id}`),
    getLatestLogbookForIntern: (internId) => apiFetch(`/interns/${internId}/logbooks/latest`),
    getPendingLogbookForIntern: (internId) => apiFetch(`/interns/${internId}/logbooks/pending`),
    addLogbook: (logbook) => apiFetch('/logbooks', { method: 'POST', body: JSON.stringify(logbook) }),
    updateLogbook: (id, changes) => apiFetch(`/logbooks/${id}`, { method: 'PUT', body: JSON.stringify(changes) }),
    approveLogbook: (id) => apiFetch(`/logbooks/${id}/approve`, { method: 'POST' }),
    requestLogbookRevision: (id, note) => apiFetch(`/logbooks/${id}/revision`, { method: 'POST', body: JSON.stringify({ note }) }),
    getVacancies: () => apiFetch('/vacancies'),
    getVacancy: (id) => apiFetch(`/vacancies/${id}`),
    addVacancy: (vacancy) => apiFetch('/vacancies', { method: 'POST', body: JSON.stringify(vacancy) }),
    updateVacancy: (id, changes) => apiFetch(`/vacancies/${id}`, { method: 'PUT', body: JSON.stringify(changes) }),
    getApplicants: (vacancyId) => apiFetch(`/applicants${vacancyId ? `?vacancyId=${vacancyId}` : ''}`),
    getApplicant: (id) => apiFetch(`/applicants/${id}`),
    updateApplicant: (id, changes) => apiFetch(`/applicants/${id}`, { method: 'PUT', body: JSON.stringify(changes) }),
    getApplications: () => apiFetch('/applications'),
    applyVacancy: (vacancyId) => apiFetch('/applications/apply', { method: 'POST', body: JSON.stringify({ vacancyId }) }),
    approveApplication: (id) => apiFetch(`/applications/${id}/approve`, { method: 'POST' }),
    convertSks: (studentId, sks) => apiFetch('/sks/convert', { method: 'POST', body: JSON.stringify({ studentId, sks }) }),
    deleteSksConversion: (studentId) => apiFetch(`/sks/convert/${studentId}`, { method: 'DELETE' }),
    getEvaluationCandidates: () => apiFetch('/evaluations/candidates'),
    getEvaluations: () => apiFetch('/evaluations'),
    getEvaluation: (candidateId) => apiFetch(`/evaluations/${candidateId}`),
    saveEvaluation: (evaluation) => apiFetch('/evaluations', { method: 'POST', body: JSON.stringify(evaluation) }),
    getSksConversions: () => apiFetch('/sks'),
    getCompanyProfile: () => apiFetch('/company-profile'),
    saveCompanyProfile: (changes) => apiFetch('/company-profile', { method: 'POST', body: JSON.stringify(changes) }),
    saveRoleProfile: (role, changes) => apiFetch(`/people/role/${role}`, { method: 'POST', body: JSON.stringify(changes) }),
    getRecentActivities: () => apiFetch('/activities'),

    // CV and Requirements
    uploadCvFile: (filePath, fileType) => apiFetch('/cv/upload', { method: 'POST', body: JSON.stringify({ filePath, fileType }) }),
    getCv: (studentId = 'me') => apiFetch(`/cv/${studentId}`),
    updateCvDetails: (studentId = 'me', details) => apiFetch(`/cv/${studentId}`, { method: 'PUT', body: JSON.stringify(details) }),
    deleteCvFile: (studentId = 'me') => apiFetch(`/cv/${studentId}/file`, { method: 'DELETE' }),
    getVacancyRequirements: (id) => apiFetch(`/vacancies/${id}/requirements`),
    saveVacancyRequirements: (id, requirements) => apiFetch(`/vacancies/${id}/requirements`, { method: 'POST', body: JSON.stringify(requirements) }),
    getApplicationReviews: (id) => apiFetch(`/applications/${id}/cv-reviews`),
    reviewApplicationCv: (id, reviewerType, review) => apiFetch(`/applications/${id}/review-cv`, { method: 'POST', body: JSON.stringify({ reviewerType, ...review }) }),

    statusLabel: (status) => {
      const map = {
        submitted: 'Submitted',
        pending: 'Submitted',
        approved: 'Approved',
        revision: 'Revision',
        rejected: 'Rejected'
      };
      return map[status] || status || 'Submitted';
    },

    statusBadge: (status) => {
      if (['approved', 'Approved', 'Accepted', 'Completed'].includes(status)) return 'badge-success';
      if (['revision', 'Revision', 'Pending', 'Waiting', 'Menunggu', 'Diproses', 'Perlu Review'].includes(status)) return 'badge-warning';
      if (['Rejected', 'Ditolak', 'rejected'].includes(status)) return 'badge-danger';
      return 'badge-info';
    },

    syncSidebarBadges: async (userId) => {
      try {
        const logbooks = await api.getLogbooks();
        const pendingCount = logbooks.filter((item) => ['submitted', 'pending'].includes((item.status || '').toLowerCase())).length;
        const actionCount = logbooks.filter((item) => ['submitted', 'pending', 'revision'].includes((item.status || '').toLowerCase())).length;
        
        try {
          const badges = JSON.parse(localStorage.getItem('simag_badges') || '{}');
          badges.pendingLogbooks = pendingCount;
          badges.reviewLogbooks = actionCount;
          localStorage.setItem('simag_badges', JSON.stringify(badges));
        } catch (e) {}

        document.querySelectorAll('.sidebar-item').forEach((item) => {
          const badge = item.querySelector('.badge');
          if (!badge) return;
          const label = item.textContent.replace(/\d+/g, '').trim();
          if (label.includes('Logbook Saya')) {
            badge.textContent = actionCount;
            badge.style.display = actionCount > 0 ? '' : 'none';
          }
          if (label.includes('Review Logbook') || label.includes('Monitoring Logbook')) {
            badge.textContent = pendingCount;
            badge.style.display = pendingCount > 0 ? '' : 'none';
          }
          if (label.includes('Notifikasi')) {
            // hide notification badge - no server-side notifications yet
            badge.style.display = 'none';
          }
        });
      } catch (err) {
        console.error('Failed to sync sidebar badges', err);
      }
    },
    
    // Auth directly from API
    login: async (identifier, password, role) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password, role })
        });
        return response.json();
    },
    
    register: async (fullname, name, identifier, password, role) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullname, name, identifier, password, role })
        });
        return response.json();
    }
  };

  global.SIMAG_DATA = api;
  global.SIMAG_MITRA = api;

  global.SIMAG_CLEAR_API_CACHE = clearGetCache;
})(window);
