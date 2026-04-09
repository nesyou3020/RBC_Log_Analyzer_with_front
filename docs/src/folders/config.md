# `src/config/` — Documentation

> **Folder location:** `frontend/src/config/`

This folder contains **constant values** used throughout the app — things that don't change at runtime and are shared by many files.

Files:
- `env.ts` — The backend API base URL
- `routes.ts` — All frontend URL paths

---

## `env.ts`

### 1. File Role

`env.ts` reads the **backend API base URL** from an environment variable and exports it as a constant.

Instead of hardcoding `http://localhost:8000` in every API call, all code imports `env.apiBaseUrl` from here. If the backend URL ever changes, you only update one place.

---

### 2. Code Explanation (Line by Line)

```ts
Line 1: export const env = {
```
→ Declares and exports an object named `env`. Other files can import it: `import { env } from '../config/env'`.

---

```ts
Line 2:   apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
```
→ Sets the `apiBaseUrl` property.

Let's break this into two parts:

**`import.meta.env.VITE_API_BASE_URL`**  
This reads an **environment variable** called `VITE_API_BASE_URL`. Environment variables are values set outside the code — for example, in a `.env` file:
```
VITE_API_BASE_URL=http://api.mycompany.com
```
Vite makes these available to your code via `import.meta.env`.

**`?? 'http://localhost:8000'`**  
The `??` is the **nullish coalescing operator**. It means: "If the left side is `null` or `undefined`, use the right side instead."

So the full line means: "Use the `VITE_API_BASE_URL` environment variable if it is set; otherwise fall back to `http://localhost:8000`."

During local development, no `.env` file is usually needed — the app talks to `localhost:8000` automatically.
In production, you set `VITE_API_BASE_URL` to point to the real server.

---

```ts
Line 3: };
```
→ Closes the `env` object.

---

### 3. Concepts

#### 🔹 Environment Variables

An **environment variable** is a value set in the operating system or a config file, **outside** your code.

Reasons to use them:
- The backend URL is different in development vs. production — environment variables let you switch without touching source code.
- Sensitive values (API keys, secrets) should never be committed to Git — environment variables keep them out of code.

In Vite, environment variables that start with `VITE_` are exposed to the browser:

```
# .env file (not committed to Git):
VITE_API_BASE_URL=http://api.mycompany.com
```

```ts
// In your code:
console.log(import.meta.env.VITE_API_BASE_URL); // "http://api.mycompany.com"
```

> ⚠️ Variables that do **not** start with `VITE_` are kept secret and not injected into the browser bundle.

---

#### 🔹 Nullish Coalescing (`??`)

The `??` operator provides a fallback for `null` or `undefined` only (not for `0`, `false`, or `""`):

```ts
const value = null ?? 'default';   // → 'default'
const value = undefined ?? 'default'; // → 'default'
const value = '' ?? 'default';     // → '' (empty string is NOT null/undefined)
const value = 0 ?? 42;             // → 0  (zero is NOT null/undefined)
```

This is different from `||` (OR), which falls back for any falsy value.

---

### 4. Summary

`env.ts` exports a single object with one property: `apiBaseUrl`. It reads the backend URL from a Vite environment variable, falling back to `http://localhost:8000` for local development. All API service functions import `env.apiBaseUrl` instead of hardcoding the URL.

---

---

## `routes.ts`

### 1. File Role

`routes.ts` defines **all URL paths** of the frontend application in one central place.

Instead of typing the string `'/imports'` in multiple files (and risking typos), you import `routes.imports` from here. If you rename a route, you only change one line.

---

### 2. Code Explanation (Line by Line)

```ts
Line 1: export const routes = {
```
→ Declares and exports an object named `routes`.

---

```ts
Line 2:   login: '/login',
```
→ The URL for the login page. The browser shows this path when you are not logged in.

---

```ts
Line 3:   dashboard: '/',
```
→ The root URL (`/`) — the homepage/dashboard shown after login.

---

```ts
Line 4:   imports: '/imports',
```
→ The URL for the Import Files page.

---

```ts
Line 5:   events: '/events',
```
→ The URL for the Events page (browsing log file events).

---

```ts
Line 6:   scenarios: '/scenarios',
```
→ The URL for the Scenarios page.

---

```ts
Line 7:   users: '/users',
```
→ The URL for the Users management page (admin only).

---

```ts
Line 8:   reportGenerator: '/report-generator',
```
→ The URL for the Report Generator page.

---

```ts
Line 9:   reports: '/reports',
```
→ The URL for the Reports page.

---

```ts
Line 10:   audit: '/audit',
```
→ The URL for the Audit Logs page.

---

```ts
Line 11:   settings: '/settings',
```
→ The URL for the Settings page.

---

```ts
Line 12:   unauthorized: '/unauthorized'
```
→ The URL for the Unauthorized page — shown when a user tries to access a page they don't have permission for.

---

```ts
Line 13: };
```
→ Closes the `routes` object.

---

### 3. Concepts

#### 🔹 Centralised Constants

Imagine you have the string `'/imports'` written in 5 different files:
- `router.tsx` (to define the route)
- `MainLayout.tsx` (for the nav link)
- `DashboardPage.tsx` (for the "quick actions" button)
- `ProtectedRoute.tsx` (maybe in error messages)

If you decide to rename it to `'/log-imports'`, you have to find and change it in 5 places — and it's easy to miss one.

With `routes.ts`, you have one source of truth:

```ts
// Change in ONE place:
imports: '/log-imports',

// And all other files automatically use the new URL:
<NavLink to={routes.imports}>Import Files</NavLink>
```

---

#### 🔹 How Routes Work in a React SPA

In a Single-Page Application (SPA), there is only one real HTML page (`index.html`).
The browser never truly "navigates" to a new page — instead, React Router intercepts the URL change and decides which component to render.

```
User clicks "Import Files" link
     ↓
React Router sees URL changed to /imports
     ↓
Router finds the <Route path="/imports" element={<ImportsPage />} />
     ↓
React renders <ImportsPage /> in the main content area
     ↓
Browser URL shows /imports, but no full page reload happened
```

The strings in `routes.ts` are the paths React Router uses for this matching.

---

### 4. Summary

`routes.ts` exports an object that maps readable names (`routes.imports`, `routes.dashboard`) to URL path strings (`'/imports'`, `'/'`). This centralises all route paths in one file, preventing typos and making renaming easy. Every component that needs a URL (links, navigation, redirects) imports from here.

---

---

## Folder Summary

The `config/` folder has two files with one purpose each:

| File | Exports | Used for |
|------|---------|---------|
| `env.ts` | `env.apiBaseUrl` | The backend server's base URL |
| `routes.ts` | `routes.*` | All frontend URL paths |

Both files follow the same pattern: **export a constant object** with named properties that other files import. This prevents magic strings (hardcoded values scattered through code) and makes the app easier to maintain.
