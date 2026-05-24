# UI/UX Design Guidelines - SIMAG

## Overview
Dokumen ini berisi panduan dasar desain UI/UX untuk pengembangan sistem SIMAG agar tampilan aplikasi tetap konsisten, modern, dan mudah digunakan oleh pengguna.

---

## Design Tools
Pengerjaan High Fidelity UI Design dilakukan menggunakan platform Figma.

Tools yang digunakan:
- Figma
- Whimsical
- Draw.io
- Visual Studio Code

Tautan menuju workspace Figma akan dilampirkan pada dokumen final SPB.

---

## Color Palette Utama

| Role | Color | Hex |
|------|--------|------|
| Primary | Indigo | `#4F46E5` |
| Secondary | Emerald | `#10B981` |
| Background | Gray | `#F3F4F6` |
| Text Dark | Slate | `#1F2937` |
| Danger | Red | `#EF4444` |
| Warning | Amber | `#F59E0B` |

---

## Typography

| Element | Font | Weight |
|---------|------|---------|
| Heading | Poppins | Bold |
| Subheading | Poppins | SemiBold |
| Body Text | Inter | Regular |
| Button | Inter | Medium |

Minimum font size: `14px`

---

# CSS Design Variables

```css
:root {
  --primary-color: #4F46E5;
  --secondary-color: #10B981;
  --background-color: #F3F4F6;
  --text-color: #1F2937;
  --danger-color: #EF4444;
  --warning-color: #F59E0B;

  --border-radius: 8px;
  --transition-speed: 0.3s;

  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Inter', sans-serif;
}
