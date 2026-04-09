# `src/layouts/` — Documentation

> **Folder location:** `frontend/src/layouts/`

This folder contains the **page shell** — the persistent UI frame that surrounds every protected page.

Files:
- `MainLayout.tsx`

---

## `MainLayout.tsx`

### 1. File Role

`MainLayout.tsx` is the **outer frame of the application's protected pages**.

It renders:
- The **left sidebar** — logo, navigation menu, admin section, logout button
- The **top navigation bar** — breadcrumb, search box, theme toggle, notification icons, and the logged-in user's avatar
- The **main content area** — where the current page renders (via `<Outlet />`)
- The **footer** — version number and help link

Every protected page (Dashboard, Imports, Events, etc.) is displayed inside this layout.
The layout stays fixed; only the content area in the middle changes when you navigate.

---

### 2. Code Explanation (Line by Line)

```tsx
Lines 1–7: imports
```

```tsx
import { useEffect, useState, type MouseEvent } from 'react';
```
→ `useEffect` — runs side effects (applying the theme). `useState` — stores the theme state. `type MouseEvent` — TypeScript type for click events.

```tsx
import { NavLink, Outlet, useLocation } from 'react-router-dom';
```
→ `NavLink` — like `<Link>` but automatically adds an `"active"` class when its URL matches the current URL.
`Outlet` — renders the current page's component inside the layout.
`useLocation` — gives the current URL path.

```tsx
import { routes } from '../config/routes';
import { useAuth } from '../hooks/useAuth';
import { applyTheme, persistTheme, resolveTheme } from '../utils/theme';
import appLogo from '../../logo/logo.png';
```
→ Imports routes, auth hook, theme utilities, and the app logo image.

---

```tsx
Line 9: export function MainLayout() {
```
→ Defines and exports the `MainLayout` component.

---

```tsx
Line 10: const { user, logout } = useAuth();
```
→ Gets the logged-in user (for the avatar and username display) and the logout mutation function from `useAuth`.

---

```tsx
Line 11: const location = useLocation();
```
→ Gets the current URL location. Used to check if we are on the Events page.

---

```tsx
Line 12: const [theme, setTheme] = useState<'light' | 'dark'>(() => resolveTheme());
```
→ Creates a `theme` state variable. The initialiser `() => resolveTheme()` reads the stored or OS theme on first render.

---

```tsx
Line 14: const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');
```
→ A function passed to `NavLink`'s `className` prop. React Router calls it with `{ isActive: true/false }` for each link. Returns `'active'` for the current page's link, `''` for others.
This makes the current page's nav item visually highlighted.

---

```tsx
Line 15: const hideNavbarSearch = location.pathname.startsWith(routes.events);
```
→ Hides the search bar in the top nav when you are on the Events page (Events has its own search UI).

---

```tsx
Lines 17–20:
const doLogout = (event: MouseEvent) => {
  event.preventDefault();  // ← prevent the default <a> href navigation
  logout.mutate();          // ← trigger the logout mutation
};
```
→ The logout click handler. Calls `logout.mutate()` which triggers the logout API call and then clears the session and navigates to `/login`.

---

```tsx
Lines 22–24:
useEffect(() => {
  applyTheme(theme);
}, [theme]);
```
→ Every time `theme` state changes, this effect runs and calls `applyTheme(theme)` — which sets the `data-theme` attribute on `<html>` to switch all CSS variables.

`[theme]` is the **dependency array** — the effect only re-runs when `theme` changes.

---

```tsx
Lines 26–30:
const toggleTheme = () => {
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
  persistTheme(nextTheme);
};
```
→ The theme toggle button handler. Switches between `'light'` and `'dark'`, updates state (causing a re-render), and saves the choice to localStorage.

---

```tsx
Lines 32–40: Sidebar logo section
<div className="sidebar-logo">
  <img src={appLogo} alt="ERTMS ETCS logo" ... />
  <span>ERTMS/ETCS Analyzer</span>
</div>
```
→ The top of the sidebar: the logo image and the app name.

---

```tsx
Lines 42–95: Sidebar navigation menu (`<ul className="sidebar-menu">`)
```
→ A list of navigation links. Each `<NavLink>` corresponds to one page:

| Icon | Label | Route |
|------|-------|-------|
| `fa-home` | Dashboard | `/` |
| `fa-folder` | Import Files | `/imports` |
| `fa-search` | Events | `/events` |
| `fa-list` | Scenarios | `/scenarios` |
| `fa-chart-bar` | Reports | `/reports` |
| `fa-users` | Users | `/users` |
| `fa-history` | Audit Logs | `/audit` |
| `fa-cog` | Settings | `/settings` |

The "Admin" section header and the Users/Audit links are rendered unconditionally — they appear for all users. However, the `RoleRoute` guard in `router.tsx` prevents engineers from actually accessing the Users page even if they click the link.

```tsx
<a href="#" onClick={doLogout}>
  <i className="fas fa-sign-out-alt"></i>
  <span>Logout</span>
</a>
```
→ The logout link — clicking it calls `doLogout`, which calls `logout.mutate()`.

---

```tsx
Lines 97–140: Top navigation bar (`<header className="navbar">`)
```

```tsx
<div className="navbar-breadcrumb">
  <NavLink to={routes.dashboard}>Dashboard</NavLink>
  <span>/</span>
  <span>Workspace</span>
</div>
```
→ A simple breadcrumb showing "Dashboard / Workspace".

```tsx
{!hideNavbarSearch ? (
  <div className="navbar-search">
    <input type="text" placeholder="Search..." />
  </div>
) : null}
```
→ Conditionally renders the search input — hidden on the Events page.

```tsx
<button type="button" className="theme-switch" onClick={toggleTheme} ...>
  <span className={`theme-switch-thumb ${theme === 'light' ? 'is-light' : 'is-dark'}`}></span>
  <i className={`fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`}></i>
</button>
```
→ The dark/light mode toggle button. Shows a sun icon in dark mode and a moon icon in light mode (the opposite of what is currently active, showing what you'll switch TO).

```tsx
<div className="navbar-user-avatar">
  {(user?.username ?? 'U').slice(0, 2).toUpperCase()}
</div>
<span className="app-user-name">{user?.username ?? 'User'}</span>
```
→ Shows the first two letters of the username as an avatar (e.g. "JO" for "john") and the full username next to it.

---

```tsx
Line 142: <main className="content app-content">
Line 143:   <Outlet />
Line 144: </main>
```
→ The main content area. `<Outlet />` is replaced by whichever page matches the current URL (e.g. `<DashboardPage />`, `<ImportsPage />`, etc.).

---

```tsx
Lines 146–152: Footer
<footer className="footer app-footer">
  <span>v1.0.0</span>
  <span><a href="#">Help &amp; Support</a></span>
</footer>
```
→ A simple footer with the app version and a help link. `&amp;` is the HTML entity for the `&` character.

---

### 3. React Concepts

#### 🔹 `useEffect` — Side Effects

`useEffect` runs code **after** a component renders. It is used for things that shouldn't happen during rendering itself (like modifying the DOM, starting timers, or making API calls).

```tsx
useEffect(() => {
  applyTheme(theme);   // ← runs after render
}, [theme]);           // ← only when 'theme' changes
```

The dependency array `[theme]` means: "re-run this effect every time `theme` changes."
- `[]` (empty array) — runs only once on mount
- `[a, b]` — runs when `a` or `b` changes
- no array — runs after every render

---

#### 🔹 `NavLink` vs `Link`

Both navigate to a URL without a full page reload.

`NavLink` also receives `{ isActive }` and can dynamically apply classes:

```tsx
<NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
  Dashboard
</NavLink>
```

When you're on `/dashboard`, this renders `<a class="active" href="/dashboard">Dashboard</a>`.
CSS then styles `.active` links differently (bold, coloured background, etc.).

---

#### 🔹 `<Outlet />` — Where Child Routes Render

The `MainLayout` is a **layout route** in `router.tsx`. Inside it, many page routes are nested:

```tsx
<Route element={<MainLayout />}>
  <Route path="/"        element={<DashboardPage />} />
  <Route path="/imports" element={<ImportsPage />} />
</Route>
```

`MainLayout` renders the sidebar and header, then puts `<Outlet />` in the main content area.
React Router replaces `<Outlet />` with whichever nested route matches the current URL.

---

#### 🔹 Template Literals in JSX

```tsx
className={`theme-switch-thumb ${theme === 'light' ? 'is-light' : 'is-dark'}`}
```

This uses a JavaScript **template literal** inside JSX to compute the class name dynamically.
It combines a fixed class `'theme-switch-thumb'` with a conditional class that depends on `theme`.

Result:
- Dark mode: `"theme-switch-thumb is-dark"`
- Light mode: `"theme-switch-thumb is-light"`

---

### 4. Summary

`MainLayout` is a large but straightforward component. It:

1. Renders the **sidebar** with the logo and navigation links.
2. Renders the **top bar** with breadcrumb, search, theme toggle, and user avatar.
3. Renders the **main content area** using `<Outlet />` — this is where each page appears.
4. Renders the **footer**.
5. Manages the **dark/light theme toggle** using `useState` + `useEffect`.
6. Handles **logout** by calling `logout.mutate()` from `useAuth`.
7. Uses `NavLink` to automatically highlight the active navigation item.

Think of it as the **picture frame** — it stays the same on every page; only the picture (`<Outlet />`) inside changes.
