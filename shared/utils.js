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
  localStorage.setItem('simag_token', sessionData.token);
  localStorage.setItem('simag_role',  sessionData.role);
  localStorage.setItem('simag_user',  JSON.stringify(sessionData.user));
}

// SIMAG Global Badges & User Info (Eliminates flicker)
function simag_renderGlobalBadges() {
  try {
    // 1. Render badges
    const badges = JSON.parse(localStorage.getItem('simag_badges') || '{}');
    document.querySelectorAll('.simag-badge-value').forEach(el => {
      const key = el.getAttribute('data-key');
      const val = parseInt(badges[key]) || 0;
      if (val > 0) {
        el.textContent = val;
        if (el.parentElement.classList.contains('badge')) el.parentElement.style.display = 'inline-block';
      } else {
        el.textContent = '';
        if (el.parentElement.classList.contains('badge')) el.parentElement.style.display = 'none';
      }
    });

  } catch (e) {}

  try {
    // Don't render user info in nosession preview mode
    const _noSession = new URLSearchParams(window.location.search).get('nosession') === 'true';
    if (!_noSession) {
      const userStr = sessionStorage.getItem('simag_user') || localStorage.getItem('simag_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.name) {
          const name = user.name || 'User';
          const initials = name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || 'U';
          document.querySelectorAll('.simag-user-name').forEach(el => {
            if (!el.closest('#app')) el.textContent = name;
          });
          document.querySelectorAll('.simag-user-initials').forEach(el => {
            if (!el.closest('#app')) el.textContent = initials;
          });
        }
      }
    }
  } catch(e) {}
}
document.addEventListener('DOMContentLoaded', simag_renderGlobalBadges);
simag_renderGlobalBadges(); // Execute immediately to prevent flash
// Expose for manual re-render after fetch
window.simag_renderGlobalBadges = simag_renderGlobalBadges;

/**
 * Baca sesi aktif.
 * @returns {{ token: string|null, role: string|null, user: object|null }}
 */
function simag_getSession() {
  // In preview mode with nosession, return empty session
  // so the dashboard renders in demo mode without leaking another role's data
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('nosession') === 'true') {
      return { token: null, role: null, user: null };
    }
  } catch (e) {}

  let token = localStorage.getItem('simag_token');
  let role  = localStorage.getItem('simag_role');
  let userStr = localStorage.getItem('simag_user');

  // Migrasi otomatis dari sessionStorage (jika ada sesi lama)
  if (!token && sessionStorage.getItem('simag_token')) {
    token = sessionStorage.getItem('simag_token');
    role  = sessionStorage.getItem('simag_role');
    userStr = sessionStorage.getItem('simag_user');
    
    localStorage.setItem('simag_token', token);
    localStorage.setItem('simag_role', role);
    localStorage.setItem('simag_user', userStr);
  }

  let parsedUser = null;
  try {
    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
      parsedUser = JSON.parse(userStr);
    }
  } catch (e) {
    // Only warn if it looks like real data but failed to parse
    if (userStr.startsWith('{')) console.warn('Failed to parse user session data');
  }

  return {
    token : token,
    role  : role,
    user  : parsedUser,
  };
}

/** Hapus sesi dan redirect ke halaman login. */
function simag_logout() {
  localStorage.removeItem('simag_token');
  localStorage.removeItem('simag_role');
  localStorage.removeItem('simag_user');
  
  const inPages = window.location.pathname.includes('/pages/');
  window.location.href = inPages ? '../login.html' : 'login.html';
}

/* ── Route Guard ─────────────────────────────────────────── */

/**
 * Panggil di awal setiap halaman dashboard.
 * Redirect ke login jika sesi tidak ada atau role tidak sesuai.
 * @param {string} requiredRole  'mahasiswa' | 'mitra' | 'adminprodi' | 'dospem'
 */
function simag_requireAuth(requiredRole) {
  // Allow preview mode for landing page iframe embeds
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('preview') === 'true') {
    return; // Skip auth redirect — render dashboard shell only
  }

  const { token, role } = simag_getSession();

  // If no specific role is required, just check for a valid token
  if (!requiredRole) {
    if (!token) {
      const inPages = window.location.pathname.includes('/pages/');
      window.location.href = inPages ? '../login.html' : 'login.html';
    }
    return;
  }

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (!token || !allowedRoles.includes(role)) {
    const inPages = window.location.pathname.includes('/pages/');
    window.location.href = inPages ? '../login.html' : 'login.html';
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
  localStorage.setItem('simag_next_role', requiredRole);
  localStorage.setItem('simag_next_url', target);
}

function simag_consumePostLoginRedirect(role) {
  const requiredRole = localStorage.getItem('simag_next_role');
  const destination = localStorage.getItem('simag_next_url');
  localStorage.removeItem('simag_next_role');
  localStorage.removeItem('simag_next_url');

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

async function simag_getAdminPendingSks() {
  try {
    if (!window.SIMAG_DATA || typeof window.SIMAG_DATA.getData !== 'function') return 0;
    const data = await window.SIMAG_DATA.getData();
    return data.interns.filter((intern) => {
      const conversion = data.sksConversions.find((item) => item.studentId === intern.id);
      return !conversion || conversion.status !== 'Completed';
    }).length;
  } catch (error) {
    return 0;
  }
}

async function simag_getAdminProfile() {
  const { user, role } = simag_getSession();
  if (user && role === 'adminprodi') {
    return user;
  }
  try {
    if (window.SIMAG_DATA && typeof window.SIMAG_DATA.getData === 'function') {
      return (await window.SIMAG_DATA.getData()).people.admin || {};
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
  const { role, user } = simag_getSession();
  if (role !== 'adminprodi') return;

  const currentPage = (window.location.pathname.split('/').pop() || '').toLowerCase();
  
  const sidebar = document.querySelector('aside');
  const nav = sidebar ? sidebar.querySelector('nav') : null;
  if (!sidebar || !nav) return;

  const brand = sidebar.querySelector('a[href="../index.html"], a[href$="index.html"]');
  if (brand) brand.textContent = 'SIMAG';

  // 1. Sync active class based on href in-place
  const items = nav.querySelectorAll('.sidebar-item');
  items.forEach(item => {
    const onclickStr = item.getAttribute('onclick') || '';
    const hrefMatch = onclickStr.match(/href='([^']+)'/);
    if (hrefMatch && hrefMatch[1]) {
      const targetPage = hrefMatch[1].toLowerCase();
      if (targetPage === currentPage) {
        item.classList.add('active');
        item.setAttribute('aria-current', 'page');
      } else {
        item.classList.remove('active');
        item.removeAttribute('aria-current');
      }
    }
  });

  // 2. Sync admin profile name & avatar initials in-place
  const adminName = (user && user.name) || 'Admin Prodi FIKOM';
  const sidebarName = sidebar.querySelector('#sidebar-name');
  if (sidebarName) {
    const innerSpan = sidebarName.querySelector('span');
    if (innerSpan) innerSpan.textContent = adminName;
    else sidebarName.textContent = adminName;
  }

  const avatar = sidebar.querySelector('#admin-initials') || sidebar.querySelector('.simag-user-initials')?.parentElement;
  if (avatar) {
    const initials = simag_initialsFromName(adminName, 'AP');
    const innerSpan = avatar.querySelector('span');
    if (innerSpan) innerSpan.textContent = initials;
    else avatar.textContent = initials;
  }

  // 3. Update pending SKS badge count in-place from localStorage cache
  const badges = JSON.parse(localStorage.getItem('simag_badges') || '{}');
  const pendingSks = parseInt(badges.pendingSks) || 0;
  const sksBadge = document.getElementById('admin-sks-pending-badge') || nav.querySelector('#admin-sks-pending-badge');
  if (sksBadge) {
    const badgeVal = sksBadge.querySelector('.simag-badge-value') || sksBadge;
    if (pendingSks > 0) {
      badgeVal.textContent = pendingSks;
      sksBadge.style.display = 'inline-block';
    } else {
      badgeVal.textContent = '';
      sksBadge.style.display = 'none';
    }
  }
}

// Generic active state sync for sidebar menus
function simag_initSidebarActiveState() {
  const currentPage = (window.location.pathname.split('/').pop() || '').toLowerCase();
  const sidebar = document.querySelector('aside');
  const nav = sidebar ? sidebar.querySelector('nav') : null;
  if (!sidebar || !nav) return;

  const items = nav.querySelectorAll('.sidebar-item');
  items.forEach(item => {
    const onclickStr = item.getAttribute('onclick') || '';
    const hrefMatch = onclickStr.match(/href='([^']+)'/);
    if (hrefMatch && hrefMatch[1]) {
      const targetPage = hrefMatch[1].toLowerCase();
      if (targetPage === currentPage) {
        item.classList.add('active');
        item.setAttribute('aria-current', 'page');
      } else {
        item.classList.remove('active');
        item.removeAttribute('aria-current');
      }
    }
  });
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

  // Sync session user data into the cloned drawer sidebar
  const { user: _drawerUser } = simag_getSession ? simag_getSession() : { user: null };
  if (_drawerUser && _drawerUser.name) {
    const drawerName = drawer.querySelector('#sidebar-name');
    const drawerInit = drawer.querySelector('#sidebar-initials');
    if (drawerName) drawerName.textContent = _drawerUser.name;
    if (drawerInit) drawerInit.textContent = _drawerUser.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  }

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
  simag_initSidebarActiveState();
  simag_initAdminSidebar();
  simag_initMobileSidebar();
  
  // Sync sidebar badges automatically across all pages
  if (window.SIMAG_DATA && typeof SIMAG_DATA.syncSidebarBadges === 'function') {
    const { user } = simag_getSession();
    SIMAG_DATA.syncSidebarBadges(user ? user.id : null);
  }
});


