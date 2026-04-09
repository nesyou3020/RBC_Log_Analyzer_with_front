# `src/hooks/` — Documentation

> **Folder location:** `frontend/src/hooks/`

This folder contains **custom React hooks** — reusable functions that encapsulate data-fetching logic for each feature area.

Instead of writing API calls and loading/error state management directly in page components, the logic lives here. Pages simply call the hook and get back ready-to-use data.

Files:
- `useAuth.ts` — Login, logout, and auth state
- `useAudit.ts` — Fetching audit logs
- `useDashboard.ts` — Fetching dashboard summary data
- `useEvents.ts` — Fetching events and trains from log files
- `useImports.ts` — Managing file imports (list, upload, delete, download)
- `usePasswordResetRequests.ts` — Managing password reset requests
- `useScenarios.ts` — Managing scenario templates
- `useUsers.ts` — Managing user accounts

---

## React Concepts (Read First)

### 🔹 What is a Custom Hook?

A React **hook** is a function that starts with `use` and uses built-in React features (like state or lifecycle).

**Custom hooks** are hooks you write yourself to extract and share logic between components.

Example without a custom hook (everything in the component):
```tsx
function ImportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/imports')
      .then(r => r.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  // Now render...
}
```

With a custom hook:
```tsx
function ImportsPage() {
  const { list } = useImports(); // ← all logic moved here
  // list.data, list.isLoading, list.error are ready to use
}
```

Much cleaner! And if another page needs the same data, it just calls `useImports()` too.

---

### 🔹 React Query: `useQuery` and `useMutation`

All hooks in this folder use **React Query** (TanStack Query) which provides two main hooks:

**`useQuery`** — for fetching (GET) data:
```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['imports'],      // ← cache key
  queryFn: listImportsApi     // ← the function that fetches data
});
```
- `data` — the result (or `undefined` while loading)
- `isLoading` — `true` while the request is in progress
- `error` — the error object (or `null`)
- `queryKey` — a unique identifier. React Query caches results by key. Same key = same cached data.

**`useMutation`** — for creating/updating/deleting (POST/PATCH/DELETE) data:
```tsx
const upload = useMutation({
  mutationFn: uploadImportApi,
  onSuccess: () => { /* called when mutation succeeds */ }
});

// Call it like this:
upload.mutate(file);
```

---

---

## `useAuth.ts`

### 1. File Role

`useAuth` provides **login and logout actions**, plus auth state (who is logged in).

It is used by the `LoginPage` (to call `login.mutate(...)`) and `MainLayout` (to call `logout.mutate()`).

---

### 2. Code Explanation (Line by Line)

```ts
Line 1: import { useMutation } from '@tanstack/react-query';
```
→ Imports `useMutation` — since login and logout are actions (not data fetches), they are mutations.

---

```ts
Line 2: import { useNavigate } from 'react-router-dom';
```
→ Imports `useNavigate` — a React Router hook that lets you programmatically navigate to a different URL.

---

```ts
Lines 3–7: imports
```
→ Imports routes, API functions, `ApiError` class, storage type, and the auth context.

---

```ts
Lines 9–11:
export function useAuth() {
  const navigate = useNavigate();
  const auth = useAuthContext();
```
→ Gets the navigation function and the current auth state from context.

---

```ts
Lines 13–22:
const login = useMutation({
  mutationFn: loginApi,
  onSuccess: (response, variables) => {
    const storageMode = variables.rememberMe ? 'localStorage' : 'sessionStorage';
    auth.setSession(response.data, storageMode);
    navigate(routes.dashboard);
  }
});
```
→ The login mutation:
- `mutationFn: loginApi` — calls the login API with the provided credentials
- `onSuccess` — on success:
  1. Decides storage mode based on the "Remember Me" checkbox
  2. Saves the session (token + user) via `auth.setSession()`
  3. Navigates to the dashboard

---

```ts
Lines 24–30:
const logout = useMutation({
  mutationFn: logoutApi,
  onSettled: () => {
    auth.clearSession();
    navigate(routes.login);
  }
});
```
→ The logout mutation:
- `onSettled` (not `onSuccess`) — runs whether the API call succeeds OR fails. Even if the server-side logout fails, we clear the local session and redirect.

---

```ts
Lines 32–47:
asMessage: (error: unknown) => { ... }
```
→ A helper that converts an error into a user-friendly string message:
- 401 → "Invalid username or password."
- 403 → "Your account is disabled or access is restricted."
- Other `ApiError` → the error message from the server
- Unexpected errors → "Unexpected error"

---

```ts
Line 49: return { ...auth, login, logout, asMessage };
```
→ Returns everything from the auth context (`token`, `user`, `isAuthenticated`) spread together with the login/logout mutations and the error message helper.

---

---

## `useDashboard.ts`

### 1. File Role

Fetches the **dashboard summary** data (stats, recent files, recent activity).

---

### 2. Code Explanation (Line by Line)

```ts
export function useDashboard() {
  const summary = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummaryApi,
    select: (response) => response.data
  });

  return { summary };
}
```

- `queryKey: ['dashboard-summary']` — cache key for this data
- `queryFn: getDashboardSummaryApi` — the API function to call
- `select: (response) => response.data` — transforms the response before storing it. The raw API response is `{ data: DashboardSummary }` — `select` unwraps it so `summary.data` is the `DashboardSummary` directly.

Returns `{ summary }` where `summary` has `.data`, `.isLoading`, `.error`.

---

---

## `useAudit.ts`

### 1. File Role

Fetches **audit logs** with pagination and optional filters.

---

### 2. Code Explanation

```ts
export function useAudit(params: { page, pageSize, action?, result? }) {
  const list = useQuery({
    queryKey: ['audit', params.page, params.pageSize, params.action ?? '', params.result ?? ''],
    queryFn: () => listAuditLogsApi(params)
  });

  return { list };
}
```

- The `queryKey` includes all parameters. When `params.page` changes, the key changes → React Query fetches the new page and caches both.
- `params.action ?? ''` — if `action` is undefined, use `''` in the key (ensures consistent key format).

---

---

## `useEvents.ts`

### 1. File Role

Provides several hooks for the Events page:
- `useTrains(fileId)` — list of train IDs in a file
- `useEvents(params)` — paginated events
- `useAllEvents(fileId, mode)` — ALL events fetched page by page (for export/graph)
- `useRawEvents(...)` — paginated raw events
- `useAllRawEvents(fileId)` — ALL raw events for the speed graph

---

### 2. Code Explanation (Key Parts)

**`useTrains`**
```ts
export function useTrains(fileId: string | null) {
  return useQuery({
    queryKey: ['events', 'trains', fileId],
    queryFn: () => listTrainsApi(fileId as string),
    select: (resp) => resp.data.train_ids,
    enabled: Boolean(fileId)     // ← only run query if fileId is not null
  });
}
```

`enabled: Boolean(fileId)` — React Query only runs the query if `fileId` is a truthy value. If no file is selected yet, the query is skipped.

---

**`useAllEvents`** — Pagination Loop

```ts
export function useAllEvents(fileId: string | null, mode: EventMode) {
  return useQuery({
    queryFn: async () => {
      const pageSize = 500;
      let page = 1;
      let total = Number.POSITIVE_INFINITY;
      const items: EventRow[] = [];

      while (items.length < total) {
        const response = await listEventsApi({ fileId, mode, page, pageSize });
        items.push(...response.data.items);
        total = response.data.total;
        if (response.data.items.length === 0) break;
        page += 1;
      }

      return items;
    }
  });
}
```

This is a **pagination loop** — it fetches 500 events at a time and keeps fetching until it has all of them. This is needed for downloading all events as a file or building the complete speed graph.

`...response.data.items` uses the **spread operator** to add all items to the `items` array at once.

---

---

## `useImports.ts`

### 1. File Role

Manages **file imports** — listing, uploading, deleting, and downloading log files.

---

### 2. Code Explanation

```ts
const key = ['imports'];  // ← shared query key for invalidation

export function useImports() {
  const queryClient = useQueryClient();  // ← access to the cache

  const list = useQuery({ queryKey: key, queryFn: listImportsApi, select: resp => resp.data });

  const upload = useMutation({
    mutationFn: uploadImportApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  });

  const remove = useMutation({
    mutationFn: deleteImportApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  });

  const download = useMutation({ mutationFn: downloadImportApi });

  return { list, upload, remove, download };
}
```

**`queryClient.invalidateQueries({ queryKey: key })`** — After uploading or deleting a file, this tells React Query that the cached list is stale. React Query immediately refetches it, and the UI automatically updates to show the new list.

This is the **optimistic update pattern** via cache invalidation — you don't need to manually refresh the page.

---

---

## `useScenarios.ts`

### 1. File Role

Manages **scenario templates** — listing, creating (from JSON or Excel), previewing, and deleting.

---

### 2. Code Explanation

Same pattern as `useImports`:
- `list` — fetches all scenarios
- `create` — creates from JSON payload, then invalidates list
- `uploadExcel` — creates from an Excel file, then invalidates list
- `previewExcel` — previews what an Excel import would create (without saving)
- `remove` — deletes a scenario, then invalidates list

`previewExcel` does NOT invalidate the list because it only previews — it doesn't actually save anything.

---

---

## `useUsers.ts`

### 1. File Role

Manages **user accounts** — listing, creating, changing roles/status, and deleting.

---

### 2. Code Explanation

```ts
const setRole = useMutation({
  mutationFn: (input: { userId: string; role: 'validator' | 'engineer' }) =>
    setUserRoleApi(input.userId, input.role),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
});
```

`setRole` and `setActive` take an object with multiple properties as input. The `mutationFn` destructures it and calls the appropriate API function.

---

---

## `usePasswordResetRequests.ts`

### 1. File Role

Manages **password reset requests** — listing pending requests, approving, and rejecting them.

This hook is only usable by validators (admins), shown in `SettingsPage` and `DashboardPage`.

---

### 2. Code Explanation (Key Parts)

```ts
export interface PasswordResetRequest {
  request_id: string;
  username: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}
```
→ Defines the type locally (not in `types/` since it's specific to this hook).

```ts
const list = useQuery({
  queryKey: ['passwordResetRequests'],
  queryFn: listPasswordResetRequestsApi,
  select: (response) => (response.data?.requests ?? []) as PasswordResetRequest[],
  staleTime: 10 * 1000  // ← cache is considered fresh for 10 seconds
});
```

`staleTime: 10 * 1000` — React Query won't refetch this data more than once every 10 seconds, even if the component re-renders. This avoids hammering the server on every render.

---

---

## Folder Summary

All hooks follow the same pattern:
1. Use `useQuery` for reading data (with a cache key and query function)
2. Use `useMutation` for writing data (with cache invalidation on success)
3. Return the query/mutation objects so the page component can access `.data`, `.isLoading`, `.error`, `.mutate`

| Hook | Queries | Mutations |
|------|---------|-----------|
| `useAuth` | — | `login`, `logout` |
| `useDashboard` | `summary` | — |
| `useAudit` | `list` | — |
| `useEvents` | `trains`, `events`, `allEvents`, `rawEvents`, `allRawEvents` | — |
| `useImports` | `list` | `upload`, `remove`, `download` |
| `useScenarios` | `list` | `create`, `uploadExcel`, `previewExcel`, `remove` |
| `useUsers` | `list` | `create`, `setRole`, `setActive`, `remove` |
| `usePasswordResetRequests` | `list` | `approve`, `reject` |

The hooks keep page components clean — pages describe **what to show**, hooks manage **how to get the data**.
