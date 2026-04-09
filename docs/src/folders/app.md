# `src/app/` — Documentation

> **Folder location:** `frontend/src/app/`

This folder contains the **application-level wiring** — the code that connects everything together: routing (which page to show), route guards (who can access which page), and providers (global services setup).

Structure:
```
app/
├── router.tsx              ← Maps URLs to page components
├── guards/
│   ├── ProtectedRoute.tsx  ← Blocks unauthenticated users
│   └── RoleRoute.tsx       ← Blocks users without the required role
└── providers/
    └── AppProviders.tsx    ← Sets up React Router, React Query, and Auth
```

---

## `app/providers/AppProviders.tsx`

### 1. File Role

`AppProviders.tsx` is the **outermost wrapper** of the entire application.

It sets up three global services that every component in the app needs access to:
1. **`BrowserRouter`** — Enables React Router (URL-based navigation)
2. **`QueryClientProvider`** — Enables React Query (data fetching and caching)
3. **`AuthProvider`** — Provides the logged-in user's token and info

All three are "providers" — they use React Context to make their features available to all components nested inside them.

---

### 2. Code Explanation (Line by Line)

```tsx
Line 1: import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
```
→ Imports React Query's `QueryClient` (the cache manager) and `QueryClientProvider` (the Context provider that makes it available).

---

```tsx
Line 2: import { ReactNode, useState } from 'react';
```
→ `ReactNode` is the TypeScript type for "anything React can render" (components, text, elements). `useState` creates the `QueryClient` instance.

---

```tsx
Line 3: import { BrowserRouter } from 'react-router-dom';
```
→ Imports the router that reads the browser's URL and enables `<Link>` and `<Navigate>` components.

---

```tsx
Line 4: import { AuthProvider } from '../../store/authContext';
```
→ Imports the authentication Context provider from `store/authContext.tsx`.

---

```tsx
Lines 6–8:
type Props = {
  children: ReactNode;
};
```
→ TypeScript type for the component's props. `children: ReactNode` means this component wraps other components passed inside it as children.

---

```tsx
Line 10: export function AppProviders({ children }: Props) {
```
→ Defines the `AppProviders` component. It receives `children` — the rest of the app — and wraps it with providers.

---

```tsx
Lines 11–20:
const [queryClient] = useState(
  () => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false
      }
    }
  })
);
```
→ Creates a `QueryClient` instance using `useState`. Using `useState` here ensures the same `QueryClient` instance is kept across re-renders (instead of creating a new one each time).

**`defaultOptions`** sets global defaults for all queries:
- `retry: 1` — If a query fails, retry once before showing an error (instead of the default 3 retries).
- `refetchOnWindowFocus: false` — By default, React Query re-fetches data when the browser tab comes back into focus. Disabling this avoids unexpected refetches in this app.

---

```tsx
Lines 22–28:
return (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);
```
→ The three providers are **nested** (each wraps the next). The order matters:
- `BrowserRouter` must be outermost (router must be available for Auth and Query consumers).
- `QueryClientProvider` makes React Query available.
- `AuthProvider` makes auth state available.
- `{children}` — the actual app (`<AppRouter />`) is rendered inside all three.

---

### 3. Concepts

#### 🔹 What is a Provider?

A **Provider** is a React component that uses Context to share data or services with all components nested inside it.

```tsx
// Provider at the top:
<QueryClientProvider client={queryClient}>
  <App />          ← has access to queryClient
    <ImportsPage /> ← has access to queryClient
      <button /> ← has access to queryClient
</QueryClientProvider>
```

Without the provider, nested components cannot access the service.

---

#### 🔹 React Query's `QueryClient`

`QueryClient` is the brain of React Query. It manages:
- **Cache** — Stores results of previous API calls so you don't re-fetch unnecessarily
- **Background updates** — Refreshes stale data automatically
- **Invalidation** — Marks cached data as stale after mutations (e.g. after uploading a file, invalidate the file list so it refetches)

You create one `QueryClient` for the whole app and share it via `QueryClientProvider`.

---

---

## `app/router.tsx`

### 1. File Role

`router.tsx` defines the **navigation structure of the entire application**.

It maps each URL path to the correct page component, and nests routes inside guards and layouts.

---

### 2. Code Explanation (Line by Line)

```tsx
Line 1: import { Navigate, Route, Routes } from 'react-router-dom';
```
→ `Routes` — a container for all route definitions.
`Route` — defines one URL path → component mapping.
`Navigate` — renders a redirect to a different URL.

---

```tsx
Lines 2–16: imports
```
→ Imports all guards, the layout, and every page component. Each import corresponds to one screen.

---

```tsx
Line 18: export function AppRouter() {
```
→ Defines the `AppRouter` component.

---

```tsx
Lines 19–45: return ( <Routes> ... </Routes> )
```
→ The JSX that defines the entire route tree. Let's read it level by level:

```tsx
<Routes>
  {/* Public route — anyone can access */}
  <Route path={routes.login} element={<LoginPage />} />

  {/* Protected: must be logged in */}
  <Route element={<ProtectedRoute />}>

    {/* Layout: all pages inside share the same sidebar/header/footer */}
    <Route element={<MainLayout />}>

      {/* Regular protected pages */}
      <Route path={routes.dashboard} element={<DashboardPage />} />
      <Route path={routes.imports} element={<ImportsPage />} />
      <Route path={routes.events} element={<EventsPage />} />
      <Route path={routes.scenarios} element={<ScenariosPage />} />
      <Route path={routes.reportGenerator} element={<ReportGeneratorPage />} />
      <Route path={routes.reports} element={<ReportsPage />} />
      <Route path={routes.audit} element={<AuditPage />} />
      <Route path={routes.settings} element={<SettingsPage />} />

      {/* Role-restricted: only 'validator' role */}
      <Route element={<RoleRoute role="validator" />}>
        <Route path={routes.users} element={<UsersPage />} />
      </Route>

    </Route>
  </Route>

  {/* Other public routes */}
  <Route path={routes.unauthorized} element={<UnauthorizedPage />} />
  <Route path="*" element={<NotFoundPage />} />
  <Route path="" element={<Navigate to={routes.dashboard} replace />} />
</Routes>
```

Key points:
- `<Route element={<ProtectedRoute />}>` — A **layout route** that runs `ProtectedRoute` before rendering any of its children. If the check fails, the children never render.
- `<Route element={<MainLayout />}>` — Another layout route that wraps child pages inside the sidebar+header shell.
- `path="*"` — A wildcard that matches any URL not matched by the other routes → shows `NotFoundPage`.
- `path=""` — The root URL redirects to the dashboard.

---

### 3. Concepts

#### 🔹 Nested Routes

React Router supports nesting routes inside other routes. Child routes only render if the parent route's element renders (and renders an `<Outlet />`).

This lets you layer layout wrappers and guards without repeating them:

```tsx
// Instead of repeating <ProtectedRoute> on every page:
<Route element={<ProtectedRoute />}>    ← check once
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/imports"   element={<ImportsPage />} />
  <Route path="/events"    element={<EventsPage />} />
</Route>
```

---

#### 🔹 Layout Routes

A route with an `element` but no `path` is a **layout route** — it wraps its children but doesn't match any URL itself.

```tsx
<Route element={<MainLayout />}>
  <Route path="/" element={<DashboardPage />} />
  <Route path="/imports" element={<ImportsPage />} />
</Route>
```

`MainLayout` renders `<Outlet />` which is replaced by whichever child matches the current URL.

---

---

## `app/guards/ProtectedRoute.tsx`

### 1. File Role

`ProtectedRoute` is a **security gate** for protected pages.

If the user is NOT logged in, it redirects them to the login page instead of showing the protected content.

---

### 2. Code Explanation (Line by Line)

```tsx
Line 1: import { Navigate, Outlet } from 'react-router-dom';
```
→ `Navigate` — renders a redirect. `Outlet` — renders the matched child route (the actual page).

---

```tsx
Line 2: import { routes } from '../../config/routes';
```
→ Imports the route paths constant (to get `routes.login` = `'/login'`).

---

```tsx
Line 3: import { useAuthContext } from '../../store/authContext';
```
→ Imports the auth context hook to check if the user is logged in.

---

```tsx
Lines 5–10:
export function ProtectedRoute() {
  const auth = useAuthContext();
  if (!auth.isAuthenticated) {
    return <Navigate to={routes.login} replace />;
  }
  return <Outlet />;
}
```
→ The component logic:

1. Reads the auth context (`useAuthContext()`).
2. Checks `auth.isAuthenticated` — this is `true` if a JWT token is saved in the browser.
3. If NOT authenticated → return `<Navigate to={routes.login} replace />` which immediately redirects to `/login`.
4. If authenticated → return `<Outlet />` which renders the actual page.

The `replace` prop on `<Navigate>` means "replace the current history entry" — so pressing the Back button doesn't take you back to the protected page, it goes further back.

---

### 3. Concepts

#### 🔹 `<Outlet />`

In nested routes, `<Outlet />` is a **placeholder** where the matched child route renders.

```tsx
function ProtectedRoute() {
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <Outlet />; // ← Renders the child page (DashboardPage, ImportsPage, etc.)
}
```

Without `<Outlet />`, the child routes would never render.

---

#### 🔹 Route Guards Pattern

Route guards are a common pattern in SPAs:

```
User navigates to /dashboard
     ↓
React Router renders ProtectedRoute
     ↓
ProtectedRoute checks: is user logged in?
  YES → render <Outlet /> → DashboardPage renders ✅
  NO  → render <Navigate to="/login" /> → user is redirected ❌
```

---

---

## `app/guards/RoleRoute.tsx`

### 1. File Role

`RoleRoute` is a **role-based access control** guard.

Even if a user is logged in, they might not have permission to access certain pages. This guard checks if the user has the required role before allowing access.

---

### 2. Code Explanation (Line by Line)

```tsx
Line 1: import { Navigate, Outlet } from 'react-router-dom';
Line 2: import { routes } from '../../config/routes';
Line 3: import { useAuthContext } from '../../store/authContext';
```
→ Same imports as `ProtectedRoute`.

---

```tsx
Line 5: export function RoleRoute({ role }: { role: 'validator' | 'engineer' }) {
```
→ The component accepts a prop `role` that specifies the required role.
TypeScript enforces that only `'validator'` or `'engineer'` can be passed.

---

```tsx
Lines 6–10:
const auth = useAuthContext();
if (auth.user?.role !== role) {
  return <Navigate to={routes.unauthorized} replace />;
}
return <Outlet />;
```
→ Logic:
1. Reads the current user from the auth context.
2. Checks if the user's role matches the required role.
3. If NOT matching → redirect to `/unauthorized` (Unauthorized page).
4. If matching → render the child page via `<Outlet />`.

`auth.user?.role` — the `?.` is **optional chaining**: if `auth.user` is `null`, this evaluates to `undefined` instead of throwing an error.

---

### 3. Concepts

#### 🔹 Role-Based Access Control (RBAC)

This app has two roles:
- `'validator'` — Admin role. Can manage users, see all audit logs, manage password resets.
- `'engineer'` — Standard user. Can upload files, view events, create scenarios.

The `<RoleRoute role="validator" />` guard protects routes that only validators should access:

```tsx
<Route element={<RoleRoute role="validator" />}>
  <Route path={routes.users} element={<UsersPage />} />
</Route>
```

If an engineer tries to navigate to `/users`:
1. `ProtectedRoute` passes (they are logged in ✅)
2. `RoleRoute` fails (their role is `'engineer'`, not `'validator'`) → redirected to `/unauthorized`

---

#### 🔹 Optional Chaining (`?.`)

`auth.user?.role` safely accesses a property that might not exist:

```ts
// Without optional chaining — crashes if user is null:
auth.user.role  // ❌ TypeError: Cannot read property 'role' of null

// With optional chaining — returns undefined if user is null:
auth.user?.role  // ✅ returns undefined safely
```

---

---

## Folder Summary

| File | Purpose |
|------|---------|
| `providers/AppProviders.tsx` | Wraps the entire app with BrowserRouter, QueryClientProvider, and AuthProvider |
| `router.tsx` | Maps URLs to page components, nesting guards and layout |
| `guards/ProtectedRoute.tsx` | Redirects to `/login` if user is not authenticated |
| `guards/RoleRoute.tsx` | Redirects to `/unauthorized` if user doesn't have the required role |

Together, these four files define **who can go where** and **what wraps all pages**.
