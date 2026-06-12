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
 * @param {string} requiredRole  'mahasiswa' | 'mitra' | 'admin'
 */
function simag_requireAuth(requiredRole) {
  const { token, role } = simag_getSession();
  if (!token || role !== requiredRole) {
    window.location.href = '../login.html';
  }
}

/* ── Role-Based Redirect After Login ─────────────────────── */

/**
 * Arahkan pengguna ke dashboard yang sesuai setelah login.
 * @param {string} role  'mahasiswa' | 'mitra' | 'adminprodi' | 'dospem'
 */
function simag_redirectToDashboard(role) {
  const map = {
    mahasiswa : 'pages/dashboard-mahasiswa.html',
    mitra     : 'pages/dashboard-mitra.html',
    adminprodi: 'pages/dashboard-admin.html',
    dospem    : 'pages/dashboard-dospem.html',
  };
  const path = map[role];
  if (path) window.location.href = path;
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

document.addEventListener('DOMContentLoaded', simag_initScrollReveal);
