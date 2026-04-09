# `src/styles/` — Documentation

> **Folder location:** `frontend/src/styles/`

This folder contains the **global CSS file** that defines the visual design of the entire application.

Files:
- `global.css`

---

## `global.css`

### 1. File Role

`global.css` is the **design system** of the application.

It defines:
- **CSS Custom Properties (variables)** — all colours, spacing, and typography tokens for both dark and light themes
- **Base reset** — removes browser default styles for consistent rendering
- **Layout classes** — the application shell (`.layout`, `.sidebar`, `.main-container`)
- **Component styles** — cards, tables, buttons, forms, modals, badges, navigation, etc.
- **Utility classes** — small helpers like `.muted`, `.error`, `.grid`

This file is imported once in `main.tsx` and applies to the entire app automatically.

---

### 2. Code Explanation (Key Sections)

> **Note:** `global.css` is a large file (~1000+ lines). This documentation explains the most important sections, not every single line. Individual component-level styles defined inside page files (using `<style>` tags) are not documented here.

---

#### Section 1 — CSS Custom Properties (Design Tokens)

```css
:root {
  /* Brand Colors */
  --color-primary: #3B82F6;
  --color-primary-dark: #2563EB;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #06B6D4;
  --color-brand: #1E3A8A;

  /* Backgrounds */
  --color-bg-primary: #0F172A;
  --color-bg-secondary: #1E293B;
  --color-bg-tertiary: #334155;

  /* Text Colors */
  --color-text-primary: #F1F5F9;
  --color-text-secondary: #CBD5E1;
  --color-text-muted: #94A3B8;
  ...
}
```

→ `:root` selects the root `<html>` element. CSS variables defined here are available everywhere in the stylesheet.

Variables use the `--variable-name` syntax and are read with `var(--variable-name)`.

**Why variables?** Because the same colour appears in hundreds of places. If you change `--color-primary` from blue to green, every button, link, and highlight across the app updates automatically.

---

#### Section 2 — Light Theme Overrides

```css
[data-theme="light"] {
  --color-bg-primary: #F8FAFC;
  --color-bg-secondary: #FFFFFF;
  --color-bg-tertiary: #F1F5F9;
  --color-text-primary: #1E293B;
  --color-text-secondary: #475569;
  --color-text-muted: #94A3B8;
  --color-border: #E2E8F0;
  --color-sidebar-bg: #1E3A8A;
  ...
}
```

→ When the `<html>` element has `data-theme="light"` (set by `applyTheme()` in `theme.ts`), these values override the `:root` defaults.

The dark theme variables are defined in `:root` (the default). Light theme overrides them here. Every component that uses `var(--color-bg-primary)` automatically switches to the correct colour.

---

#### Section 3 — Base Reset

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, ...;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  ...
}
```

→ `box-sizing: border-box` — makes element sizing intuitive: padding and border are included in the declared width/height (not added on top).
`margin: 0; padding: 0` — removes browser defaults (some browsers add margins to `<h1>`, `<p>`, etc. by default).
The `body` styles set the default font and background colour for the whole page.

---

#### Section 4 — Layout

```css
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);    /* 240px */
  background-color: var(--color-sidebar-bg);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  ...
}

.main-container {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
```

→ The app uses **CSS Flexbox** for its main layout:
- `.layout` is a flex row — sidebar on the left, main container on the right
- `.sidebar` has a fixed width and fixed position (it doesn't scroll)
- `.main-container` takes all remaining space (`flex: 1`) and has a left margin equal to the sidebar width

---

#### Section 5 — Component Styles

**Cards:**
```css
.card {
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border);
  padding: var(--spacing-xl);
}
```
→ The standard "card" container used throughout the app for grouping content.

---

**Buttons:**
```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: 14px;
  cursor: pointer;
  ...
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-secondary {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}
```
→ Buttons use a base `.btn` class plus a variant class (`.btn-primary`, `.btn-secondary`).

---

**Tables:**
```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 16px;
}

.table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
}
```
→ All data tables use these consistent styles — grey uppercase headers, bordered rows.

---

**Form elements:**
```css
.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-primary);
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}
```
→ Form inputs are full-width with consistent padding, border, and a blue highlight on focus.

---

**Modals:**
```css
.modal {
  display: none;        /* hidden by default */
  position: fixed;
  inset: 0;             /* cover the full viewport */
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  ...
}

.modal.active {
  display: flex;        /* show when .active class is added */
  align-items: center;
  justify-content: center;
}
```
→ Modals are always in the DOM but hidden (`display: none`). Adding the `active` class (done via React state) shows them as a centred overlay on a dark backdrop.

---

**Utility classes:**
```css
.muted { color: var(--color-text-muted); font-size: 14px; }
.error { color: var(--color-error); font-size: 13px; }
.grid { display: grid; gap: var(--spacing-lg); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
```
→ Small reusable utility classes used in JSX without writing CSS:
- `.muted` — makes text grey (used by `EmptyState` and `Loading`)
- `.error` — makes text red (used by `ErrorAlert`)
- `.grid`, `.grid-cols-2`, `.grid-cols-4` — CSS Grid layouts for the dashboard cards

---

**Theme switch (dark/light toggle):**
```css
.theme-switch {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 20px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  cursor: pointer;
}

.theme-switch-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.theme-switch-thumb.is-light { background: var(--color-warning); }
.theme-switch-thumb.is-dark  { background: #94a3b8; }
```
→ The toggle button in the top navbar. A small circle changes colour to indicate the current mode.

---

### 3. CSS Concepts

#### 🔹 CSS Custom Properties (Variables)

CSS variables are defined with `--` prefix and used with `var()`:

```css
:root {
  --primary-color: #3B82F6;
}

button {
  background-color: var(--primary-color); /* uses the variable */
}
```

Benefits:
- One place to change = updates everywhere
- Enables easy theming (redefine variables per theme)
- Editor autocomplete support

---

#### 🔹 CSS Flexbox

Flexbox is a layout model for arranging elements in a row or column:

```css
.container {
  display: flex;
  flex-direction: row;   /* horizontal (default) */
  align-items: center;   /* vertically centered */
  gap: 16px;             /* space between items */
}
```

The app uses flexbox for:
- The main layout (sidebar + content area side by side)
- Navigation links (icon + text side by side)
- Buttons (icon + label side by side)

---

#### 🔹 CSS Grid

CSS Grid is for two-dimensional layouts (rows AND columns):

```css
.grid-cols-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);  /* 4 equal columns */
  gap: 16px;
}
```

The dashboard's stat cards use grid to create a 4-column layout that adapts to the available space.

---

#### 🔹 `box-sizing: border-box`

By default (without this), if you give an element `width: 200px` and `padding: 20px`, the actual width becomes `240px` (200 + 20 + 20).

With `box-sizing: border-box`, the padding is included inside the 200px — the element stays 200px wide. This is much more intuitive, which is why nearly every modern CSS project applies it globally.

---

#### 🔹 CSS Specificity

When multiple CSS rules target the same element, the most **specific** rule wins:

```css
p { color: grey; }          /* low specificity */
.muted { color: #94A3B8; }  /* higher — class beats element */
#title { color: black; }    /* highest — ID beats class */
```

This is why utility classes (`.btn-primary`) can override base styles (`.btn`).

---

### 4. Summary

`global.css` is the visual foundation of the entire application. It:

1. **Defines CSS variables** for all colours, spacing, and typography — enabling easy theming.
2. **Implements the light theme** as an override of the dark theme defaults via `[data-theme="light"]`.
3. **Resets browser defaults** for consistent cross-browser rendering.
4. **Styles the app layout** — sidebar, main container, header, footer using Flexbox.
5. **Provides component styles** — cards, buttons, tables, forms, modals, badges, navs.
6. **Provides utility classes** — `.muted`, `.error`, `.grid`, `.grid-cols-*` for quick layout.
7. **Styles the theme toggle** button in the top navigation bar.

Changing a colour variable in `:root` updates it across the entire app. This is the power of a centralised design system.
