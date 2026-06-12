# SIMAG Frontend

Platform manajemen magang digital — FIKOM Universitas Amikom Yogyakarta.

---

## Struktur Folder

```
simag-frontend/          ← ROOT PROJECT FRONTEND
│
├── index.html           ← Landing page (halaman publik)
├── login.html           ← Halaman login (semua role)
│
├── pages/               ← Halaman-halaman yang butuh auth
│   ├── dashboard-mahasiswa.html
│   ├── dashboard-mitra.html
│   └── dashboard-admin.html
│
└── shared/              ← Aset yang dipakai semua halaman
    ├── styles.css        ← CSS bersama (design system)
    └── utils.js          ← Auth helpers & scroll reveal
```

---

## Pemisahan Frontend ↔ Backend

### Frontend (repo ini)
Hanya berisi file statis: HTML, CSS, JS.
**Tidak ada** logika server, database, atau API handler di sini.

### Backend (repo terpisah)
Buat repo baru `simag-backend` dengan stack pilihanmu:

```
simag-backend/
├── src/
│   ├── routes/
│   │   └── auth.js       ← POST /api/auth/login
│   ├── controllers/
│   ├── models/
│   └── middleware/
├── package.json
└── .env
```

**Endpoint utama yang dibutuhkan frontend:**

| Method | Endpoint              | Body                                      | Response                             |
|--------|-----------------------|-------------------------------------------|--------------------------------------|
| POST   | `/api/auth/login`     | `{ identifier, password, role }`         | `{ success, token, role, user }`     |
| GET    | `/api/mahasiswa/me`   | Header: `Authorization: Bearer <token>`  | `{ name, nim, magang, logbooks }`    |
| POST   | `/api/logbook`        | `{ tanggal, kegiatan, ... }`             | `{ id, status }`                     |
| PATCH  | `/api/logbook/:id/approve` | —                                   | `{ status: 'approved' }`             |

---

## Cara Menjalankan (Development)

### Frontend saja (tanpa backend)
Cukup buka `index.html` di browser. Fitur demo login menggunakan data dummy di `login.html`.

### Dengan VS Code Live Server
1. Install ekstensi **Live Server**
2. Klik kanan `index.html` → **Open with Live Server**
3. URL: `http://127.0.0.1:5500/`

### Dengan npx serve
```bash
cd simag-frontend
npx serve .
# Buka http://localhost:3000
```

### Dengan Python
```bash
cd simag-frontend
python -m http.server 8080
# Buka http://localhost:8080
```

---

## Menghubungkan ke Backend Nyata

Di `login.html`, cari komentar `Production:` dan ganti `callLoginAPI()` dengan fetch asli:

```js
// Ganti ini:
const res = await callLoginAPI(identifier, password, currentRole);

// Dengan ini:
const res = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identifier, password, role: currentRole }),
}).then(r => r.json());
```

Untuk dashboard, ganti data dummy dengan `fetch()` ke endpoint backend menggunakan token dari `simag_getSession().token`.

---

## Auth Flow

```
index.html (landing)
    └─→ login.html
            ├─→ pages/dashboard-mahasiswa.html  [role: mahasiswa]
            ├─→ pages/dashboard-mitra.html      [role: mitra]
            └─→ pages/dashboard-admin.html      [role: admin]
```

Token disimpan di `sessionStorage` (habis saat tab ditutup).
Setiap dashboard memanggil `simag_requireAuth(role)` dari `shared/utils.js` —
jika token tidak ada atau role tidak sesuai, langsung redirect ke `login.html`.

---

## Demo Accounts (Development Only)

| Role      | Identifier           | Password  |
|-----------|----------------------|-----------|
| Mahasiswa | `23.11.5508`         | `demo123` |
| Mitra     | `hr@bankmandiri.co.id` | `demo123` |
| Admin     | `dwi.soleh@amikom.ac.id` | `demo123` |

Atau klik tombol **Demo Login Cepat** di halaman login.

---

## Tech Stack

- **HTML5** — Struktur halaman
- **CSS3** — `shared/styles.css` (design system custom)
- **Vanilla JS** — Tanpa framework, ringan dan portabel
- **Google Fonts** — Syne (display) + DM Sans (body)
- **Tailwind CDN** — Hanya di `index.html` untuk utility class tambahan

> **Catatan:** Tailwind hanya digunakan di landing page untuk fleksibilitas layout.
> Dashboard murni menggunakan `shared/styles.css` agar tidak ada dependency CDN di halaman yang butuh performa.
