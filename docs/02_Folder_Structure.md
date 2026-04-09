# 02 — Folder Structure

> **Who is this for?** Beginners who want to know where everything lives and why.

---

## The Big Picture

The entire frontend source code lives inside `frontend/src/`.
Every subfolder has one clear responsibility so the code stays organised and easy to find.

```
frontend/
├── index.html            ← The one HTML page the browser loads
├── logo/                 ← Logo and favicon images
├── package.json          ← Project dependencies and scripts
├── vite.config.ts        ← Build tool settings
└── src/                  ← ALL the TypeScript/React source code
    ├── main.tsx          ← Entry point — starts the whole app
    ├── App.tsx           ← Root React component
    ├── vite-env.d.ts     ← Tells TypeScript about Vite's env variables
    │
    ├── app/              ← App wiring (routing, guards, providers)
    ├── components/       ← Small reusable UI pieces
    ├── config/           ← Constants: URL paths and environment settings
    ├── hooks/            ← Data-fetching logic (talks to the backend)
    ├── layouts/          ← The sidebar + navbar shell
    ├── pages/            ← Full-page screens (one file per page)
    ├── services/         ← HTTP client and API functions
    ├── store/            ← Global login state shared across the app
    ├── styles/           ← Global CSS stylesheet
    ├── types/            ← TypeScript data shapes
    └── utils/            ← Pure helper functions
```

---

## File by File — Root of `src/`

### `main.tsx`

**Think of it as:** the power button of the app.

This is the very first file that runs. It mounts the React application onto the
single `<div id="root">` in `index.html` and wraps everything in `<AppProviders>`.
You will almost never need to edit this file.

### `App.tsx`

**Think of it as:** the shell that holds every page together.

It calls `<AppRouter>` to show the correct page depending on the current URL.
It sits between `main.tsx` (which starts React) and `app/router.tsx` (which decides
which page to show).

### `vite-env.d.ts`

**Think of it as:** a tiny translator file.

Vite lets you read environment variables (like `VITE_API_BASE_URL`) using
`import.meta.env`. This file tells TypeScript that those variables exist so
there are no type errors. You do not need to edit it.

---

## `app/` — App Wiring

**Think of it as:** the traffic controller.

```
app/
├── router.tsx          ← All URL routes in one place
├── guards/
│   ├── ProtectedRoute.tsx   ← Blocks access to logged-out users
│   └── RoleRoute.tsx        ← Blocks access based on user role
└── providers/
    └── AppProviders.tsx     ← Wraps the app with needed context
```

### `app/router.tsx`

Defines every URL route (e.g. `/imports`, `/events`, `/users`).
It nests routes inside guards so that:
- Logged-out users are redirected to `/login`.
- Engineers are redirected away from validator-only pages like `/users`.

### `app/guards/ProtectedRoute.tsx`

Checks whether the user is logged in.
If **not** → redirects to `/login`.
If **yes** → lets the user through to the requested page.

### `app/guards/RoleRoute.tsx`

Checks the user's *role* (validator or engineer).
If the role does not match what the route requires → redirects to `/unauthorized`.
This is how the Users page stays hidden from Engineers.

### `app/providers/AppProviders.tsx`

Wraps the whole app with three things the rest of the code depends on:
1. **BrowserRouter** — enables URL-based navigation.
2. **QueryClientProvider** — powers all data fetching via TanStack Query.
3. **AuthProvider** — makes login state available everywhere.

---

## `components/` — Reusable UI Pieces

**Think of it as:** a box of Lego bricks — small, reusable building blocks.

```
components/
├── EmptyState.tsx    ← Shown when a list has no items ("No results found")
├── ErrorAlert.tsx    ← Shown when an API call fails
└── Loading.tsx       ← Spinner or skeleton shown while data is loading
```

These three components are used throughout many pages to keep loading/error/empty
states consistent. Instead of writing the same "Loading…" paragraph on every page,
we write it once here and reuse it everywhere.

---

## `config/` — Constants

**Think of it as:** a settings file — one place to change values that are used in many places.

```
config/
├── env.ts       ← Backend base URL (reads from VITE_API_BASE_URL, defaults to localhost:8000)
└── routes.ts    ← All URL paths in one object  { login: '/login', imports: '/imports', … }
```

### `config/env.ts`

```ts
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
};
```

Contains the backend's address. To point the app at a production server, just
set `VITE_API_BASE_URL` in a `.env` file — no other code needs to change.

### `config/routes.ts`

Lists every URL path as a named constant.
Using names (like `routes.imports`) instead of raw strings (like `'/imports'`)
means renaming a route only requires one change here, not dozens of changes across the codebase.

---

## `hooks/` — Data-Fetching Logic

**Think of it as:** the middleman between the page and the backend.

```
hooks/
├── useAuth.ts                    ← Login, logout, password change
├── useAudit.ts                   ← Fetch audit log entries
├── useDashboard.ts               ← Fetch dashboard statistics
├── useEvents.ts                  ← Search and filter events in a file
├── useImports.ts                 ← Upload, list, and delete import files
├── usePasswordResetRequests.ts   ← Manage password-reset requests (validator only)
├── useScenarios.ts               ← Create and manage test scenarios
└── useUsers.ts                   ← Manage user accounts (validator only)
```

Each hook uses **TanStack Query** to:
1. Send an HTTP request to the backend.
2. Cache the response so the page does not re-fetch every second.
3. Expose a `data`, `isLoading`, and `isError` value that the page can use.

**Example flow:**
```
ImportsPage  →  useImports()  →  importsApi.getImports()  →  HTTP GET /imports
                                     ↓
                           Backend returns list of files
                                     ↓
                  TanStack Query caches the list and returns it to the page
```

---

## `layouts/` — Page Shell

**Think of it as:** the picture frame around every page.

```
layouts/
└── MainLayout.tsx    ← Sidebar + navbar + footer wrapper
```

`MainLayout.tsx` renders:
- **Sidebar** on the left with navigation links (Dashboard, Imports, Events…).
- **Top navbar** with a search bar, dark/light mode toggle, notification bell, and user avatar.
- **Main content area** in the middle — this is where each page component appears.
- **Footer** at the bottom with the app version.

Every logged-in page uses `MainLayout` as its outer shell. The router puts
`<MainLayout>` as the parent of all protected routes, so the sidebar and navbar
appear automatically on every page without repeating code.

---

## `pages/` — Full-Page Screens

**Think of it as:** each screen the user can navigate to.

```
pages/
├── LoginPage.tsx             ← Username / password login form
├── DashboardPage.tsx         ← Home: summary cards and recent activity
├── ImportsPage.tsx           ← Upload XML log files, see file list
├── EventsPage.tsx            ← Search events inside a file + train speed chart
├── ScenariosPage.tsx         ← Create and manage test scenarios
├── ReportGeneratorPage.tsx   ← Configure and trigger a report
├── ReportsPage.tsx           ← List and download generated reports
├── UsersPage.tsx             ← Manage user accounts (validator only)
├── AuditPage.tsx             ← View the audit log (validator only)
├── SettingsPage.tsx          ← Change password, toggle theme
├── UnauthorizedPage.tsx      ← Shown when access is denied
└── NotFoundPage.tsx          ← Shown for unknown URLs (404)
```

Each page file is one React component. It:
1. Calls the relevant hook(s) to get data from the backend.
2. Renders the UI using that data.
3. Handles user actions (button clicks, form submissions) and calls the hook's mutation functions.

---

## `services/` — HTTP Communication

**Think of it as:** the post office — it handles all messages sent to and received from the backend.

```
services/
├── storage.ts          ← Saves and reads the login token in browser storage
└── api/
    ├── client.ts       ← Core HTTP function used by every API call
    ├── endpoints.ts    ← All backend URL paths in one place
    ├── auth.api.ts     ← Login, logout, password-reset endpoints
    ├── audit.api.ts    ← Audit log endpoints
    ├── dashboard.api.ts← Dashboard statistics endpoints
    ├── events.api.ts   ← Event search / train graph endpoints
    ├── imports.api.ts  ← File upload / list / delete endpoints
    ├── scenarios.api.ts← Scenario CRUD endpoints
    └── users.api.ts    ← User management endpoints
```

### `services/api/client.ts`

The central `apiRequest()` function. Every other API file goes through it.
It automatically:
- Attaches the login token (from `storage.ts`) to every request as a header.
- Throws a meaningful error if the backend responds with an error code.

### `services/api/endpoints.ts`

All backend URL paths in one object (e.g. `ENDPOINTS.auth.login = '/auth/login'`).
Changing a URL only requires updating this one file.

### `services/storage.ts`

Saves the login **token** and **user object** to either `localStorage` (persists after
closing the browser) or `sessionStorage` (cleared when the tab closes), depending on
whether the user ticked "Remember me".

---

## `store/` — Global State

**Think of it as:** the app's memory — information that every component can read at any time.

```
store/
└── authContext.tsx    ← Who is logged in, what their role is, token management
```

### `store/authContext.tsx`

Creates a **React Context** called `AuthContext` that holds:
- The JWT token (proof that the user is logged in).
- The user object (username, role, id).
- `isAuthenticated` — true/false flag used by route guards.
- `setSession()` — saves the token after a successful login.
- `clearSession()` — wipes the token on logout.

Any component in the app can call `useAuthContext()` to read this data without
passing it down through props.

---

## `styles/` — Global CSS

**Think of it as:** the app's visual design rules.

```
styles/
└── global.css    ← All CSS variables, layout styles, component styles
```

The entire app's visual appearance is defined here as one stylesheet.
It uses **CSS custom properties** (variables) for colours, spacing, and borders —
for example `--color-primary` or `--spacing-md` — so that switching between
dark mode and light mode only requires changing the values of those variables
on the `<html>` element (`data-theme="dark"` or `data-theme="light"`).

---

## `types/` — TypeScript Shapes

**Think of it as:** a dictionary that defines what each piece of data looks like.

```
types/
├── index.ts        ← Re-exports all types from one place
├── api.ts          ← Generic API response wrapper  { data, error, status }
├── audit.ts        ← AuditLog object shape
├── dashboard.ts    ← DashboardStats object shape
├── event.ts        ← Event / RBC message object shape
├── import.ts       ← ImportedFile object shape
├── scenario.ts     ← Scenario and ScenarioStep object shapes
└── user.ts         ← User and LoginResponse object shapes
```

TypeScript **types** describe the shape of data. For example, `user.ts` says:
*"A User has an `_id` string, a `username` string, a `role` that is either
`'validator'` or `'engineer'`, and a `created_at` date string."*

This lets the editor warn you immediately if you try to use a field that does not
exist, or if you pass the wrong type to a function.

---

## `utils/` — Helper Functions

**Think of it as:** a toolbox of small, general-purpose tools.

```
utils/
├── theme.ts           ← Read, apply, and persist dark/light mode preference
└── trainGraphUtils.ts ← Transform raw backend events into chart-ready data points
```

### `utils/theme.ts`

Handles the dark/light mode feature:
- `resolveTheme()` — reads the user's saved preference, or falls back to the OS setting.
- `applyTheme()` — sets `data-theme="dark"` or `data-theme="light"` on `<html>`.
- `persistTheme()` — saves the preference to `localStorage`.

### `utils/trainGraphUtils.ts`

Takes a raw list of events from the backend (each with a timestamp, train speed `V_Train`,
and train mode `M_Mode`) and produces a clean array of data points ready to be drawn
as a line chart by Recharts. It also fills in "gaps" between seconds to create a
smooth step-like graph (similar to how it looks in Excel).

---

## Quick Reference Table

| Folder | One-line summary |
|--------|-----------------|
| `app/` | Routing, guards, and global providers |
| `components/` | Tiny reusable UI blocks (loading, error, empty) |
| `config/` | All constants — API base URL and route paths |
| `hooks/` | Data-fetching middlemen (one hook per feature area) |
| `layouts/` | Sidebar + navbar shell shared by all logged-in pages |
| `pages/` | One file per screen the user can visit |
| `services/api/` | HTTP client and one API file per backend domain |
| `services/storage.ts` | Saves the login token in the browser |
| `store/` | Global auth state readable from any component |
| `styles/` | All CSS in one file with dark/light mode support |
| `types/` | TypeScript shapes for every data object |
| `utils/` | Pure helper functions (theme + chart data) |
