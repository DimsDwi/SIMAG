# SIMAG Landing Page — Design System
Version: 2.0

---

## Purpose

This document is the **single source of truth** for the SIMAG landing page design. It defines exact colors, typography, spacing, components, and behavior that must be followed when building or modifying the landing page.

The landing page targets students, lecturers, and industry partners. It must communicate **credibility, simplicity, and innovation** at first glance.

---

## Tech Stack

- **CSS Framework**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **Shared Stylesheet**: `shared/styles.css` — contains `@import 'tailwindcss'`, `@theme` block, and reusable component classes
- **JavaScript Framework**: Vue 3 (loaded via CDN `vue.global.prod.js`)
- **Icons**: Lucide Icons (loaded via CDN `unpkg.com/lucide@latest`). Use **outline style only**, consistent 24px size
- **Smooth Scroll**: Lenis (loaded via CDN)
- **Fonts**: Google Fonts — `Outfit` (headings) and `Plus Jakarta Sans` (body)

### Important: Tailwind v4 Notes

Tailwind v4 uses `@theme` instead of `tailwind.config.js`. Custom values are defined in `shared/styles.css` inside the `@theme` block. The `font-heading` and `font-sans` utilities come from this theme block.

All Tailwind utility classes (e.g. `bg-white/10`, `text-[#4F46E5]`, `rounded-2xl`, `px-8`) are available and should be used directly in HTML. No separate CSS file needed for layout.

---

## Color Palette

| Token              | Value                     | Usage                          |
|---------------------|---------------------------|--------------------------------|
| Background          | `#09090B`                 | Page background                |
| Surface             | `#111217`                 | Cards, elevated containers     |
| Primary             | `#4F46E5`                 | Buttons, links, accents        |
| Accent              | `#3B82F6`                 | Secondary highlights, gradients|
| Success             | `#22C55E`                 | Positive states                |
| Text Primary        | `#FFFFFF`                 | Headings, important text       |
| Text Secondary      | `rgba(255,255,255,0.50)`  | Descriptions, labels           |
| Text Muted          | `rgba(255,255,255,0.40)`  | Captions, footer text          |
| Border              | `rgba(255,255,255,0.08)`  | Card borders, dividers         |
| Border Hover        | `rgba(255,255,255,0.12)`  | Hover state borders            |

### Gradient Rules

- Use gradients **sparingly** — only for CTA section background and hero text highlight
- Primary gradient: `from-[#4F46E5] to-[#3B82F6]`
- Never use rainbow or multi-color gradients
- Background glow: large blurred circles (`blur-[100px]`, opacity 5–7%) behind hero only

---

## Typography

| Element        | Font Family          | Size              | Weight   |
|----------------|----------------------|-------------------|----------|
| Hero Title     | `font-heading`       | `text-[64px]` desktop, `text-[48px]` mobile | 800 (extrabold) |
| Section Title  | `font-heading`       | `text-[40px]` desktop, `text-[32px]` mobile | 700 (bold) |
| Card Title     | `font-heading`       | `text-2xl` (24px) | 700 (bold) |
| Body           | `font-sans`          | `text-base` (16px)| 400 (normal) |
| Caption        | `font-sans`          | `text-sm` (14px)  | 500 (medium) |
| Small/Label    | `font-sans`          | `text-xs` (12px)  | 600 (semibold) |

### Typography Rules

- Use `tracking-tight` on all headings
- Hero title line-height: `leading-[1.05]`
- Body text line-height: `leading-relaxed`
- Body descriptions use `text-white/50` or `text-white/60`
- Never use font sizes smaller than 12px

---

## Layout

- **Max width**: `max-w-[1280px]` with `mx-auto px-8`
- **Spacing system**: Tailwind's default 4px base (use multiples: `gap-4`, `gap-6`, `gap-8`, `py-24`, `py-32`)
- **Section vertical padding**: `py-24` minimum, `py-32` for major sections
- **Section gaps**: Each section should have generous breathing room — no cramped layouts
- **Grid gaps**: `gap-6` for cards, `gap-8` for stat blocks, `gap-12` for footer columns

---

## Components

### Navbar

```
Position:       fixed top-0, full width, z-50
Height:         h-20 (80px)
Background:     Transparent when at top, bg-[#09090B]/80 backdrop-blur-md when scrolled
Border:         border-b border-transparent → border-white/10 on scroll
Contents:       Logo (left) | Nav links (center, hidden on mobile) | Auth buttons (right)
Logo font:      font-heading text-2xl font-bold
Nav link style: text-sm font-medium text-white/70 hover:text-white
CTA button:     rounded-full bg-[#4F46E5] text-sm font-semibold px-5 py-2.5
```

### Hero Section

```
Layout:         Centered text, single column
Padding:        pt-40 pb-20 (accounts for fixed navbar)
Badge:          Pill badge above title — rounded-full, bg-[#4F46E5]/10, border border-[#4F46E5]/20
Title:          64–72px, font-extrabold, tracking-tight
Subtitle:       text-lg text-white/70, max-w-2xl, font-light
CTA group:      Two buttons side by side (primary filled + secondary outline)
Dashboard mock: Below CTAs — a CSS-only skeleton mockup showing a dashboard wireframe
                Wrapped in rounded-2xl border border-white/10 bg-[#111217]
                Fades out at bottom with gradient overlay
```

### Statistics

```
Layout:         4-column grid (grid-cols-2 md:grid-cols-4)
Card style:     p-8 rounded-2xl bg-white/[0.02] border border-white/5
Number:         font-heading text-5xl font-bold text-white
Label:          text-sm text-white/50 uppercase tracking-wider
```

### Feature Cards (Bento Grid)

```
Layout:         3-column grid with mixed sizes (md:grid-cols-3)
                Two large cards (md:col-span-2) + two small cards
Row height:     auto-rows-[320px]
Card class:     glass-card (defined in styles.css)
Card padding:   p-10
Icon container: w-12 h-12 rounded-xl bg-[color]/10, icon color matches
Title:          font-heading text-2xl font-bold
Description:    text-white/60
Hover:          translateY(-4px), subtle shadow increase (handled by .glass-card)
```

### Workflow Steps

```
Layout:         Horizontal row on desktop (md:flex-row), vertical stack on mobile
Connector:      Horizontal line (h-[1px] bg-white/10) behind cards on desktop
Each step:      bg-[#09090B] p-6 rounded-2xl border border-white/5
Step number:    w-12 h-12 rounded-full, first step bg-[#4F46E5], last step bg-[#22C55E]/20
Title:          font-heading font-bold text-lg
Description:    text-sm text-white/50
```

### Role Cards

```
Layout:         4-column grid (lg:grid-cols-4, md:grid-cols-2)
Card class:     glass-card p-8
Icon:           Lucide icon, w-8 h-8, each role has a distinct color
Title:          font-heading text-xl font-bold
Description:    text-sm text-white/60
Link:           text-sm font-semibold, colored to match icon
```

### Testimonials

```
Layout:         3-column grid (md:grid-cols-3)
Card class:     glass-card p-8
Stars:          5x Lucide star icons, text-[#F59E0B] fill-current
Quote:          text-base text-white/80 font-light
Avatar:         w-10 h-10 rounded-full bg-white/10, initial letter inside
Name:           font-heading font-semibold text-sm
Role:           text-xs text-white/50
Maximum:        3 testimonials only
```

### FAQ

```
Layout:         Single column, max-w-[800px] mx-auto
Element:        Native HTML <details>/<summary> accordion
Border:         border-b border-white/10 between items
Summary style:  text-lg font-medium, hover:text-[#4F46E5]
Chevron:        Lucide chevron-down icon, rotates 180° when open
Answer:         text-white/60 font-light leading-relaxed
```

### CTA Section

```
Container:      rounded-[32px], bg-gradient-to-br from-[#4F46E5] to-[#3B82F6]
Padding:        p-16 md:p-24
Headline:       font-heading text-[40px] md:text-[56px] font-extrabold text-white
Button:         bg-white text-[#4F46E5], rounded-full, px-10 py-5
                hover: bg-white/90, -translate-y-1
Shadow:         shadow-[0_20px_40px_rgba(79,70,229,0.2)]
Content:        Only a headline and ONE button — no extra text
```

### Footer

```
Background:     bg-[#111217] (slightly lighter than page)
Layout:         4-column grid (md:grid-cols-4), first column spans 2
Logo:           Same as navbar
Description:    text-white/50 text-sm
Column titles:  font-semibold mb-6
Links:          text-sm text-white/50 hover:text-white
Copyright bar:  pt-8 border-t border-white/5, text-xs text-white/40
```

---

## Cards (`.glass-card` in styles.css)

```css
background:     var(--color-brand-surface, #111217)
border:         1px solid rgba(255,255,255,0.08)
border-radius:  24px
backdrop-filter: blur(12px)
transition:     transform 300ms ease, box-shadow 300ms ease
box-shadow:     0 4px 12px rgba(0,0,0,0.1)

/* Hover */
transform:      translateY(-4px)
box-shadow:     0 12px 24px rgba(0,0,0,0.2)
border-color:   rgba(255,255,255,0.12)
```

---

## Buttons

| Type        | Style                                                    |
|-------------|----------------------------------------------------------|
| Primary     | `bg-[#4F46E5]` rounded-full, hover: `brightness-110`, shadow, `-translate-y-0.5` |
| Secondary   | `bg-white/5 border border-white/10` rounded-full, hover: `bg-white/10` |
| Ghost       | Text only, hover: color change                           |
| Danger      | `text-red-400 hover:bg-red-400/10`                       |

---

## Animations

### Allowed
- **Fade up on scroll**: `.reveal` class — `opacity: 0` + `translateY(30px)` → active state removes both
- **Hover lift**: `hover:-translate-y-0.5` to `hover:-translate-y-1`
- **Scale on hover**: `group-hover:scale-110` for decorative elements only
- **Transitions**: `transition-all duration-300` or `transition-colors`

### Forbidden
- Bounce
- Flash / blink
- Shake
- Rotate (except FAQ chevron)
- Animations longer than 800ms
- Floating orb animations on the landing page (keep background static with blur)

---

## Background Treatment

- Use **two large blurred circles** fixed behind the page content
- One at top-left (`bg-[#4F46E5]`, opacity 7%, blur 100px)
- One at bottom-right (`bg-[#3B82F6]`, opacity 5%, blur 100px)
- These are **static** — no floating/moving animation
- Use `pointer-events-none` and `z-[-1]`

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| `md` (768px+) | Multi-column grids activate, nav links visible |
| Below `md` | Single column layouts, nav links hidden, stacked workflow |
| Hero title | `text-[48px]` on mobile, `text-[64px]` md, `text-[72px]` lg |

---

## Section Order (Top to Bottom)

1. Navbar (fixed)
2. Hero (badge + title + subtitle + CTAs + dashboard mockup)
3. Trusted By (grayscale logo row)
4. Statistics (4 number cards)
5. Features (Bento Grid)
6. Workflow (5 steps)
7. User Roles (4 role cards)
8. Testimonials (3 cards)
9. FAQ (accordion)
10. CTA (gradient container)
11. Footer

---

## DO

✓ Use exact hex values from the color palette above
✓ Keep generous whitespace between sections
✓ Use `font-heading` (Outfit) for ALL headings
✓ Use `font-sans` (Plus Jakarta Sans) for body text
✓ Use Lucide outline icons consistently
✓ Keep transitions under 300ms
✓ Use the `.glass-card` class for all card components
✓ Apply `reveal` class for scroll-triggered animations

## DON'T

✗ Use colors outside the defined palette (no neon, no random purples)
✗ Use `backdrop-filter: blur` on cards — it's already in `.glass-card` in CSS
✗ Use different border-radius values per card (always 24px via `.glass-card`)
✗ Add bouncing, flashing, or rotating animations
✗ Use emoji icons — always use Lucide icons
✗ Create inline `<style>` blocks for layout — use Tailwind utility classes
✗ Add more than 3 testimonials
✗ Mix languages (keep content consistently in one language per page)
