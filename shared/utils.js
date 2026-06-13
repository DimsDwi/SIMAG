/* ============================================================
   SIMAG — Shared Auth & Navigation Utilities
   Digunakan oleh semua halaman.
   ============================================================ */

'use strict';

/* ── Session Helpers ─────────────────────────────────────── */

/**
 * Simpan sesi setelah login berhasil.
 * @param {{ token: string, role: string, user: object }} sessionData
 */
function simag_saveSession(sessionData) {
  sessionStorage.setItem('simag_token', sessionData.token);
  sessionStorage.setItem('simag_role',  sessionData.role);
  sessionStorage.setItem('simag_user',  JSON.stringify(sessionData.user));
}

/**
 * Baca sesi aktif.
 * @returns {{ token: string|null, role: string|null, user: object|null }}
 */
function simag_getSession() {
  return {
    token : sessionStorage.getItem('simag_token'),
    role  : sessionStorage.getItem('simag_role'),
    user  : JSON.parse(sessionStorage.getItem('simag_user') || 'null'),
  };
}

/** Hapus sesi dan redirect ke halaman login. */
function simag_logout() {
  sessionStorage.clear();
  window.location.href = '../login.html';
}

/* ── Route Guard ─────────────────────────────────────────── */

/**
 * Panggil di awal setiap halaman dashboard.
 * Redirect ke login jika sesi tidak ada atau role tidak sesuai.
 * @param {string} requiredRole  'mahasiswa' | 'mitra' | 'adminprodi' | 'dospem'
 */
function simag_requireAuth(requiredRole) {
  const { token, role } = simag_getSession();
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (!token || !allowedRoles.includes(role)) {
    window.location.href = '../login.html';
  }
}

/* ── Role-Based Redirect After Login ─────────────────────── */

/**
 * Arahkan pengguna ke dashboard yang sesuai setelah login.
 * @param {string} role  'mahasiswa' | 'mitra' | 'adminprodi' | 'dospem'
 */
function simag_getDashboardPath(role) {
  const map = {
    mahasiswa : 'pages/dashboard-mahasiswa.html',
    mitra     : 'pages/dashboard-mitra.html',
    adminprodi: 'pages/dashboard-admin.html',
    dospem    : 'pages/dashboard-dospem.html',
  };
  return map[role] || '';
}

function simag_setPostLoginRedirect(requiredRole, destination) {
  const target = String(destination || '');
  if (!requiredRole || !target.startsWith('pages/')) return;
  sessionStorage.setItem('simag_next_role', requiredRole);
  sessionStorage.setItem('simag_next_url', target);
}

function simag_consumePostLoginRedirect(role) {
  const requiredRole = sessionStorage.getItem('simag_next_role');
  const destination = sessionStorage.getItem('simag_next_url');
  sessionStorage.removeItem('simag_next_role');
  sessionStorage.removeItem('simag_next_url');

  if (requiredRole === role && destination && destination.startsWith('pages/')) {
    return destination;
  }
  return '';
}

function simag_redirectToDashboard(role) {
  const path = simag_consumePostLoginRedirect(role) || simag_getDashboardPath(role);
  if (path) window.location.href = path;
}

/** Ubah teks dinamis menjadi aman sebelum dimasukkan melalui innerHTML. */
function simag_escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function simag_initialsFromName(name, fallback) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || fallback || 'AP';
}

function simag_getAdminPendingSks() {
  try {
    if (!window.SIMAG_DATA || typeof window.SIMAG_DATA.getData !== 'function') return 0;
    const data = window.SIMAG_DATA.getData();
    return data.interns.filter((intern) => {
      const conversion = data.sksConversions.find((item) => item.studentId === intern.id);
      return !conversion || conversion.status !== 'Completed';
    }).length;
  } catch (error) {
    return 0;
  }
}

function simag_getAdminProfile() {
  try {
    if (window.SIMAG_DATA && typeof window.SIMAG_DATA.getData === 'function') {
      return window.SIMAG_DATA.getData().people.admin || {};
    }
  } catch (error) {
    return {};
  }
  return {};
}

function simag_adminIcon(name) {
  const icons = {
    dashboard: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    approval: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    sks: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    report: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    history: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/><path d="M12 7v5l3 2"/></svg>',
    settings: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>',
    logout: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
  };
  return icons[name] || '';
}

function simag_initAdminSidebar() {
  const currentPage = (window.location.pathname.split('/').pop() || '').toLowerCase();
  const activeMap = {
    'dashboard-admin.html': 'dashboard',
    'approval-pendaftaran.html': 'approval',
    'konversi-sks.html': 'sks',
    'laporan-admin.html': 'report',
    'riwayat-sks.html': 'history',
    'profil-admin.html': 'settings'
  };
  const activeKey = activeMap[currentPage];
  if (!activeKey) return;

  const sidebar = document.querySelector('aside');
  const nav = sidebar ? sidebar.querySelector('nav') : null;
  if (!sidebar || !nav) return;

  const brand = sidebar.querySelector('a[href="../index.html"], a[href$="index.html"]');
  if (brand) brand.textContent = 'SIMAG';

  const admin = simag_getAdminProfile();
  const adminName = admin.name || 'Admin Prodi FIKOM';
  const sidebarName = sidebar.querySelector('#sidebar-name');
  if (sidebarName) sidebarName.textContent = adminName;

  const profileBox = nav.previousElementSibling;
  const avatar = sidebar.querySelector('#admin-initials') || (profileBox ? profileBox.querySelector('div') : null);
  if (avatar) {
    avatar.id = 'admin-initials';
    avatar.textContent = admin.initials || simag_initialsFromName(adminName, 'AP');
  }

  const pendingSks = simag_getAdminPendingSks();
  const items = [
    { key: 'dashboard', label: 'Dashboard', href: 'dashboard-admin.html', icon: 'dashboard' },
    { key: 'approval', label: 'Approve Pendaftaran', href: 'approval-pendaftaran.html', icon: 'approval' },
    { key: 'sks', label: 'Konversi SKS', href: 'konversi-sks.html', icon: 'sks', badge: pendingSks },
    { key: 'report', label: 'Analitik & Laporan', href: 'laporan-admin.html', icon: 'report' },
    { key: 'history', label: 'Riwayat SKS', href: 'riwayat-sks.html', icon: 'history' }
  ];

  const renderItem = (item) => {
    const activeClass = item.key === activeKey ? ' active' : '';
    const current = item.key === activeKey ? ' aria-current="page"' : '';
    const badge = item.key === 'sks'
      ? `<span id="admin-sks-pending-badge" class="badge badge-warning" style="margin-left:auto;">${Number(item.badge || 0)}</span>`
      : '';

    return `
      <div class="sidebar-item${activeClass}" onclick="window.location.href='${item.href}'" style="cursor:pointer;"${current}>
        ${simag_adminIcon(item.icon)}
        <span>${simag_escapeHtml(item.label)}</span>
        ${badge}
      </div>
    `;
  };

  const settingsActive = activeKey === 'settings' ? ' active' : '';
  nav.innerHTML = `
    ${items.map(renderItem).join('')}
    <div style="margin-top:16px;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;">
      <div class="sidebar-item${settingsActive}" onclick="window.location.href='profil-admin.html'" style="cursor:pointer;"${activeKey === 'settings' ? ' aria-current="page"' : ''}>
        ${simag_adminIcon('settings')}
        <span>Pengaturan</span>
      </div>
      <div class="sidebar-item" onclick="simag_logout()" style="cursor:pointer;">
        ${simag_adminIcon('logout')}
        <span>Keluar</span>
      </div>
    </div>
  `;
}

/* ── Scroll Reveal ───────────────────────────────────────── */

function simag_initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
}

function simag_initMobileSidebar() {
  const sidebar = document.querySelector('aside');
  if (!sidebar) {
    document.body.classList.add('simag-no-mobile-shell');
    return;
  }
  if (document.querySelector('.simag-mobile-menu-button')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'simag-mobile-menu-button';
  button.setAttribute('aria-label', 'Buka menu navigasi');
  button.innerHTML = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';

  const overlay = document.createElement('div');
  overlay.className = 'simag-mobile-overlay';

  const drawer = document.createElement('div');
  drawer.className = 'simag-mobile-drawer';
  drawer.appendChild(sidebar.cloneNode(true));

  const openDrawer = () => {
    overlay.classList.add('open');
    drawer.classList.add('open');
    button.setAttribute('aria-label', 'Tutup menu navigasi');
  };

  const closeDrawer = () => {
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    button.setAttribute('aria-label', 'Buka menu navigasi');
  };

  button.addEventListener('click', () => {
    if (drawer.classList.contains('open')) closeDrawer();
    else openDrawer();
  });
  overlay.addEventListener('click', closeDrawer);
  drawer.addEventListener('click', (event) => {
    if (event.target.closest('.sidebar-item,a,button')) closeDrawer();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDrawer();
  });

  document.body.append(button, overlay, drawer);
}

document.addEventListener('DOMContentLoaded', () => {
  simag_initScrollReveal();
  simag_initAdminSidebar();
  simag_initMobileSidebar();
});
