# `src/` — Source Folder Overview

> **Folder location:** `frontend/src/`

---

## 1. What is the `src` folder?

`src` stands for **source**. It contains **all the code you write** for the frontend application.

Everything that appears on screen — buttons, tables, forms, navigation — is defined somewhere inside `src/`. When you run `npm run build`, Vite takes all the files inside `src/` and compiles them into a bundle that the browser can understand.

Files outside `src/` (like `vite.config.ts`, `package.json`, `index.html`) are **configuration files** — they tell tools how to handle your code. The actual code lives here.

---

## 2. Root Files Inside `src/`

Before the sub-folders, `src/` contains three special files:

| File | Purpose |
|------|---------|
| `main.tsx` | The **entry point** — the very first file that runs. It mounts the React app into the browser. |
| `App.tsx` | The **root React component** — the top-level container that wraps everything else. |
| `vite-env.d.ts` | A tiny TypeScript helper that tells TypeScript what Vite-specific features are available (like `import.meta.env`). |

---

### `main.tsx` — The Entry Point

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/global.css';
import { applyTheme, resolveTheme } from './utils/theme';

applyTheme(resolveTheme());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Line by line:**

Line 1: `import React from 'react';`  
→ Imports the React library. Required to use JSX (the HTML-like syntax).

Line 2: `import ReactDOM from 'react-dom/client';`  
→ Imports ReactDOM — the part of React that connects to the browser's HTML page.

Line 3: `import { App } from './App';`  
→ Imports the main `App` component from `App.tsx` — the root of our application.

Line 4: `import './styles/global.css';`  
→ Loads the global CSS stylesheet. All styles inside `global.css` will apply to the whole app.

Line 5: `import { applyTheme, resolveTheme } from './utils/theme';`  
→ Imports two functions from the theme utility: `resolveTheme` figures out which theme to use (light or dark), and `applyTheme` applies it to the page.

Line 7: `applyTheme(resolveTheme());`  
→ Runs immediately on startup. Detects the user's preferred theme (from saved settings or system preference) and applies it before anything is displayed. This prevents the page from "flashing" from one theme to another.

Line 9: `ReactDOM.createRoot(document.getElementById('root')!).render(...);`  
→ This is the most important line. It:
1. Finds the `<div id="root">` in `index.html`
2. Creates a React "root" inside it
3. Renders the `<App />` component inside that root

The `!` after `getElementById('root')` is a TypeScript operator that means "I am sure this element exists — don't warn me about it possibly being null."

Lines 10–12: `<React.StrictMode> <App /> </React.StrictMode>`  
→ `StrictMode` is a development helper. It wraps the whole app and gives you extra warnings in the browser console if you use React features incorrectly. It has no effect in production.

---

### `App.tsx` — The Root Component

```tsx
import { AppProviders } from './app/providers/AppProviders';
import { AppRouter } from './app/router';

export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
```

**Line by line:**

Line 1: `import { AppProviders } from './app/providers/AppProviders';`  
→ Imports the `AppProviders` component, which sets up all global services (routing, data fetching, authentication).

Line 2: `import { AppRouter } from './app/router';`  
→ Imports `AppRouter`, which defines which page to show based on the URL.

Lines 4–9: `export function App() { ... }`  
→ Defines and exports the `App` component. It wraps `AppRouter` inside `AppProviders`.

Why this structure? `AppProviders` makes global features available (like "who is logged in"). `AppRouter` uses those features to show the right page. By nesting `AppRouter` inside `AppProviders`, every page in the app can access the providers.

---

### `vite-env.d.ts` — TypeScript Vite Types

```ts
/// <reference types="vite/client" />
```

This single line tells TypeScript: "Include the type definitions that Vite provides."

This allows TypeScript to understand Vite-specific features like:
- `import.meta.env.VITE_API_BASE_URL` (reading environment variables)
- `import appLogo from '../../logo/logo.png'` (importing image files)

Without this file, TypeScript would show errors for these Vite-specific imports.

---

## 3. Sub-Folders Inside `src/`

```
src/
├── main.tsx              ← Entry point
├── App.tsx               ← Root component
├── vite-env.d.ts         ← Vite type helper
│
├── app/                  ← App-level wiring (routing, guards, providers)
│   ├── guards/           ← Route protection logic
│   └── providers/        ← Global service setup
│
├── components/           ← Small reusable UI pieces
├── config/               ← App-wide constants (URLs, route paths)
├── hooks/                ← Reusable data-fetching logic
├── layouts/              ← Page shell (sidebar, header, footer)
├── pages/                ← One file per screen/page
├── services/             ← Backend communication (API calls, token storage)
│   └── api/              ← One file per API domain
├── store/                ← Global shared state (who is logged in)
├── styles/               ← Global CSS
├── types/                ← TypeScript type definitions
└── utils/                ← Pure helper functions
```

---

## 4. Purpose of Each Folder

### 📁 `app/`
Sets up the application's navigation and wraps it with global services.
- `router.tsx` — Maps URLs to page components
- `guards/` — Protects routes: stops unauthenticated users from accessing protected pages
- `providers/` — Sets up React Query, React Router, and the Auth context

> Think of this as the **plumbing** of the app — you don't see it, but it makes everything work.

---

### 📁 `components/`
Small, reusable UI building blocks used across many pages.

Examples: a loading spinner, an error message, an "empty list" message.

> These are like **LEGO bricks** — small pieces you combine to build bigger things.

---

### 📁 `config/`
Stores constant values used throughout the app:
- `env.ts` — The backend API URL (read from environment variables)
- `routes.ts` — All URL paths (`/login`, `/dashboard`, `/imports`, etc.)

> Think of this as the app's **address book** — one central place to look up URLs and settings.

---

### 📁 `hooks/`
Custom React hooks — functions that fetch data from the backend and manage its loading/error state.

Each hook corresponds to a feature: `useAuth`, `useImports`, `useEvents`, `useScenarios`, etc.

> Think of hooks as **smart assistants** that handle all the complexity of talking to the server, so your pages just say "give me the imports" and get the data.

---

### 📁 `layouts/`
The **page shell** — the parts of the UI that stay the same across all pages: the sidebar navigation, the top bar, and the footer.

The content area in the middle changes per page; the layout stays fixed.

> Think of this as the **frame of a picture** — it stays the same; only the picture inside changes.

---

### 📁 `pages/`
One file per screen of the application. Each page is a React component that renders a full view.

| Page | What it shows |
|------|--------------|
| `LoginPage` | Username/password form |
| `DashboardPage` | Welcome screen with stats and quick actions |
| `ImportsPage` | Upload and manage log files |
| `EventsPage` | Browse events from a log file, view speed graph |
| `ScenariosPage` | Create and manage test scenarios |
| `ReportsPage` | View generated reports (placeholder) |
| `ReportGeneratorPage` | Generate reports (placeholder) |
| `AuditPage` | View audit logs of all user actions |
| `UsersPage` | Manage user accounts (admin only) |
| `SettingsPage` | Change password and app settings |
| `NotFoundPage` | Shown when the URL doesn't match anything |
| `UnauthorizedPage` | Shown when a user tries to access a page they don't have permission for |

---

### 📁 `services/`
Handles all communication with the backend server.
- `storage.ts` — Saves/reads the login token and user info from the browser
- `api/client.ts` — The core HTTP request function (`fetch` wrapper)
- `api/endpoints.ts` — All backend API paths in one place
- `api/*.api.ts` — One file per domain (auth, imports, events, users, etc.)

> Think of services as **postal workers** — you give them a message, they deliver it to the backend and bring back a response.

---

### 📁 `store/`
Holds **global state** — information that needs to be accessible from anywhere in the app.

Currently contains `authContext.tsx`, which tracks the logged-in user and their token.

> Think of this as the app's **shared memory** — any component can ask "who is logged in?" and get the answer instantly.

---

### 📁 `styles/`
Contains `global.css` — a large CSS file that defines the visual design of the entire app: colors, fonts, spacing, layout classes, card styles, button styles, dark/light theme variables, etc.

> Think of this as the app's **design system** — one file that controls how everything looks.

---

### 📁 `types/`
TypeScript type definitions — describes the shape of data objects used throughout the app.

Examples: what a `LogImport` object looks like, what a `UserPublic` object contains, what the API response envelope looks like.

> Think of types as **blueprints** — they tell TypeScript exactly what shape data should have, so it can warn you if you make a mistake.

---

### 📁 `utils/`
Pure helper functions with no side effects:
- `theme.ts` — Reads, applies, and saves the dark/light theme
- `trainGraphUtils.ts` — Transforms raw log event data into chart-ready data points

> Think of utils as **calculators** — you give them input, they return a result, with no side effects.

---

## 5. How Data Flows Through the App

Here is a simplified view of how data travels when you open, say, the Imports page:

```
Browser URL: /imports
     ↓
AppRouter → finds the /imports route
     ↓
ProtectedRoute → checks: is the user logged in?
     ↓
MainLayout → renders sidebar + header, puts ImportsPage in the content area
     ↓
ImportsPage → calls useImports() hook
     ↓
useImports() → calls listImportsApi()
     ↓
listImportsApi() → calls apiRequest('/imports')
     ↓
apiRequest() → sends HTTP GET to http://localhost:8000/imports with Bearer token
     ↓
Backend responds with JSON list of files
     ↓
React Query caches the result
     ↓
ImportsPage renders the file list as a table
```

---

## 6. Summary

The `src/` folder is organised by **responsibility**:

- **`app/`** — wires everything together (routing + providers)
- **`components/`** — tiny reusable UI pieces
- **`config/`** — constants and URLs
- **`hooks/`** — data fetching logic
- **`layouts/`** — the page frame (sidebar, header)
- **`pages/`** — the actual screens
- **`services/`** — backend communication
- **`store/`** — global shared state
- **`styles/`** — visual design
- **`types/`** — TypeScript data blueprints
- **`utils/`** — helper functions

This separation makes the code easier to find, understand, and maintain. Each folder has one clear job.
