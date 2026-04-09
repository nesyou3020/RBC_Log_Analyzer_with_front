# `src/pages/` — Documentation

> **Folder location:** `frontend/src/pages/`

This folder contains **one file per screen** of the application. Each file is a React component that represents a complete page.

Pages are the most visible parts of the codebase — they are what the user actually sees and interacts with.

| Page file | URL | Who can access |
|-----------|-----|---------------|
| `LoginPage.tsx` | `/login` | Everyone (public) |
| `DashboardPage.tsx` | `/` | All logged-in users |
| `ImportsPage.tsx` | `/imports` | All logged-in users |
| `EventsPage.tsx` | `/events` | All logged-in users |
| `ScenariosPage.tsx` | `/scenarios` | All logged-in users |
| `ReportsPage.tsx` | `/reports` | All logged-in users |
| `ReportGeneratorPage.tsx` | `/report-generator` | All logged-in users |
| `AuditPage.tsx` | `/audit` | All logged-in users |
| `SettingsPage.tsx` | `/settings` | All logged-in users |
| `UsersPage.tsx` | `/users` | Validators (admin) only |
| `NotFoundPage.tsx` | `*` (any invalid URL) | Everyone |
| `UnauthorizedPage.tsx` | `/unauthorized` | Everyone |

---

## `LoginPage.tsx`

### 1. File Role

The login screen — the first page users see. It provides:
1. A username/password login form
2. A "Forgot password?" modal for requesting a password reset

---

### 2. Code Explanation (Key Parts)

**State variables** (what the page tracks):
```tsx
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [rememberMe, setRememberMe] = useState(true);
const [validationError, setValidationError] = useState<string | null>(null);
const [forgotOpen, setForgotOpen] = useState(false);
// ... + reset form fields
```
→ Each piece of UI state is stored in a `useState` variable.
- `username`, `password` — the form inputs
- `rememberMe` — the "Remember Me" checkbox
- `validationError` — client-side validation error
- `forgotOpen` — whether the forgot-password modal is open

---

**The login form submission:**
```tsx
const onSubmit = (event: FormEvent) => {
  event.preventDefault();          // prevent browser default form submit (page reload)
  if (!username.trim() || !password.trim()) {
    setValidationError('Username and password are required');
    return;
  }
  setValidationError(null);
  login.mutate({ username, password, rememberMe });
};
```
→ `event.preventDefault()` stops the browser from reloading the page (the default behaviour for form submissions).
Validates that both fields are filled, then calls `login.mutate(...)` from `useAuth`.

---

**Controlled inputs:**
```tsx
<input
  type="text"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
```
→ This is a **controlled input** — React controls the input's value via the `username` state variable. Every keystroke fires `onChange`, which updates the state, which re-renders the input with the new value.

---

**The password reset mutation (inside the modal):**
```tsx
const passwordResetMutation = useMutation({
  mutationFn: submitPasswordResetRequestApi,
  onSuccess: () => {
    setForgotSuccess(true);
  },
  onError: (error) => {
    // Show error message based on HTTP status
  }
});
```
→ Submits a password reset request. On success, shows a confirmation message.

---

**The modal:**
```tsx
<div className={`modal ${forgotOpen ? 'active' : ''}`}
     onClick={(event) => {
       if (event.target === event.currentTarget) closeForgotPasswordModal();
     }}>
```
→ The modal is always in the DOM but hidden when `forgotOpen` is `false` (the `active` class shows/hides it via CSS).
Clicking the backdrop (outside the modal content) closes it — `event.target === event.currentTarget` checks if you clicked the backdrop itself, not something inside it.

---

### 3. React Concepts

#### 🔹 `useState` for Form State

Each form field needs its own state variable. When the user types, `onChange` updates the state:

```tsx
const [email, setEmail] = useState('');

<input
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

This is called a **controlled component** — React is the "single source of truth" for the input's value.

---

#### 🔹 `FormEvent` and `event.preventDefault()`

HTML forms, by default, reload the page when submitted. In React SPAs you don't want that — you want to handle the submission in JavaScript.

```tsx
const handleSubmit = (event: FormEvent) => {
  event.preventDefault();  // ← stop browser from reloading
  // ... your logic
};

<form onSubmit={handleSubmit}>
```

---

### 4. Summary

`LoginPage` is a public page with a login form and a forgot-password modal. It uses `useState` for all form fields and feedback messages, `useMutation` (via `useAuth`) for the login action, and another `useMutation` for the password reset request.

---

---

## `DashboardPage.tsx`

### 1. File Role

The home screen after login. Shows:
- Welcome message with the user's name and role
- Stat cards (files uploaded, reports generated, etc.) — validators only
- Pending password reset requests — validators only
- Quick action buttons (upload, reports, scenarios, events)
- Recent files and recent activity — validators only

---

### 2. Code Explanation (Key Parts)

```tsx
const auth = useAuthContext();
const dashboard = useDashboard();
const summary = dashboard.summary.data;
```
→ Reads the logged-in user from auth context and fetches the dashboard summary via `useDashboard`.

---

```tsx
const isValidator = summary?.is_validator ?? auth.user?.role === 'validator';
```
→ Determines whether to show validator-only sections. Uses the backend's `is_validator` field if available, otherwise falls back to the local user role.

---

**Conditional rendering of admin sections:**
```tsx
{isValidator ? (
  <div className="grid grid-cols-4 dashboard-stats-grid">
    {stats.map((item) => (
      <div className="stat-card" key={item.label}>
        <div className="stat-number">{item.value}</div>
        <div className="stat-label">{item.label}</div>
      </div>
    ))}
  </div>
) : null}
```
→ Stat cards are only rendered if the user is a validator. Non-validators see only the quick actions.

---

**Helper functions** at the top of the file:
- `formatRelativeTime(value)` — converts ISO dates to "Today at 14:00", "Yesterday", "3 days ago"
- `mapActionLabel(action)` — converts backend action strings like `"import_file"` to `"IMPORT"`
- `mapActionClass(action)` — returns a CSS class for colour-coding actions
- `mapActionIcon(action)` — returns a Font Awesome icon class for each action type

---

### 3. Summary

`DashboardPage` is the main overview page. It conditionally shows different content based on the user's role. It uses `useDashboard` for data and `useAuthContext` for the current user.

---

---

## `ImportsPage.tsx`

### 1. File Role

The file management page. Users can:
- Upload XML log files (drag-and-drop or click to browse)
- Filter files by name and upload date
- Download files
- Delete files (with a confirmation dialog)

---

### 2. Code Explanation (Key Parts)

**Refs for DOM access:**
```tsx
const fileInputRef = useRef<HTMLInputElement | null>(null);
const uploadZoneRef = useRef<HTMLDivElement | null>(null);
```
→ `useRef` gives direct access to a DOM element. `fileInputRef` points to the hidden `<input type="file">`. Calling `fileInputRef.current?.click()` programmatically opens the OS file picker.

---

**Filtered list with `useMemo`:**
```tsx
const filteredImports = useMemo(() => {
  return imports.filter((item) => {
    const byName = item.file.file_name.toLowerCase().includes(nameFilter.toLowerCase());
    const byDate = !dateFilter || new Date(item.uploaded_at).toISOString().slice(0, 10) === dateFilter;
    return byName && byDate;
  });
}, [imports, nameFilter, dateFilter]);
```
→ `useMemo` only recalculates `filteredImports` when `imports`, `nameFilter`, or `dateFilter` change. Without it, the filter runs on every re-render (including unrelated ones).

---

**File download:**
```tsx
const onDownload = (fileId: string) => {
  download.mutate(fileId, {
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    }
  });
};
```
→ Downloads a file using the browser's download mechanism:
1. Creates a temporary URL from the downloaded binary (`Blob`)
2. Creates a hidden `<a>` element, sets its `href` and `download` filename
3. Programmatically clicks it to trigger the browser's download
4. Removes the temporary element and URL

---

**Drag-and-drop upload zone:**
```tsx
<div
  ref={uploadZoneRef}
  onDragOver={onUploadZoneDragOver}
  onDragLeave={onUploadZoneDragLeave}
  onDrop={onUploadZoneDrop}
>
```
→ Three drag events handle the upload zone:
- `onDragOver` — highlights the zone when a file is dragged over it
- `onDragLeave` — removes the highlight when the file leaves
- `onDrop` — receives the dropped files and calls `uploadFiles()`

---

### 3. React Concepts

#### 🔹 `useRef`

`useRef` gives you a reference to a DOM element that persists across renders:

```tsx
const inputRef = useRef<HTMLInputElement>(null);

// Later, trigger a click on the hidden file input:
inputRef.current?.click();
```

Unlike `useState`, changing a ref does NOT cause a re-render. Refs are used to interact with DOM elements imperatively (e.g., focus an input, trigger a click, measure an element's size).

---

#### 🔹 `useMemo`

`useMemo` caches a computed value and only recalculates it when its dependencies change:

```tsx
const filteredList = useMemo(() => {
  return bigList.filter(item => item.name.includes(searchText));
}, [bigList, searchText]);  // ← only recalculate when these change
```

Without `useMemo`, the filter runs on every render. With large lists, this could cause slowness.

---

### 4. Summary

`ImportsPage` handles file upload, listing (with filtering), download, and deletion. It uses `useImports` for all data operations, `useRef` to control the file input and upload zone, and `useMemo` to efficiently filter the file list.

---

---

## `EventsPage.tsx`

### 1. File Role

The most complex page. Users select a log file and then:
- Browse events (filtered, paginated table)
- Filter by train ID and event mode
- Switch between "parsed" and "raw" event views
- View an interactive train speed/mode graph (using Recharts)
- Export events to CSV or JSON

---

### 2. Code Explanation (Key Parts)

**Multiple view states:**
```tsx
const [activeTab, setActiveTab] = useState<'events' | 'raw' | 'graph'>('events');
const [mode, setMode] = useState<EventMode>('without_24_136');
const [selectedTrainId, setSelectedTrainId] = useState<string>('');
const [page, setPage] = useState(1);
```
→ The page has multiple views (events, raw, graph) and several filters — each tracked with separate `useState` variables.

---

**Reset page when filters change:**
```tsx
useEffect(() => {
  setPage(1);
}, [selectedFileId, mode, selectedTrainId]);
```
→ When the user changes the file, mode, or train filter, the page number resets to 1. Without this, you could be on page 5 of one file and then switch to a different file that has only 2 pages.

---

**The speed graph (Recharts):**
```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="Time_sec" ... />
    <YAxis ... />
    <Tooltip ... />
    <Line type="stepAfter" dataKey="V_Train" stroke="#3b82f6" />
  </LineChart>
</ResponsiveContainer>
```
→ Uses the Recharts library to render a line chart. `chartData` comes from `transformRawEventsToChartData` (from `trainGraphUtils.ts`). The chart shows train speed over time as a step-function line.

---

**CSV export:**
```tsx
const exportToCsv = (rows: EventRow[]) => {
  const headers = Object.keys(rows[0] ?? {});
  const csvContent = [
    headers.join(','),
    ...rows.map(row => headers.map(h => `"${String(row[h] ?? '')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  // ... trigger download
};
```
→ Builds a CSV string from the event data and triggers a browser download.

---

### 3. Summary

`EventsPage` is the most feature-rich page — it combines file selection, multiple views (events table, raw table, speed graph), filtering, pagination, and export. It uses `useImports`, `useTrains`, `useEvents`, `useAllEvents`, `useAllRawEvents`, and `useRawEvents` hooks, plus `transformRawEventsToChartData` for the graph.

---

---

## `ScenariosPage.tsx`

### 1. File Role

Users can:
- View all scenario templates (list)
- Create a new scenario manually (step-by-step form)
- Import scenarios from an Excel file (with preview)
- Delete scenarios

---

### 2. Code Explanation (Key Parts)

**Complex local form state:**
```tsx
type StepDraft = { id: string; type: string; variables: VariableDraft[] };
type EventDraft = { id: string; name: string; steps: StepDraft[]; ... };
const [events, setEvents] = useState<EventDraft[]>([]);
```
→ The scenario creation form has a complex nested structure (scenarios → events → steps → variables). Each level is tracked in a draft state.

**Adding a step to an event:**
```tsx
const addStep = (eventId: string) => {
  setEvents(prev =>
    prev.map(ev =>
      ev.id === eventId
        ? { ...ev, steps: [...ev.steps, { id: crypto.randomUUID(), type: '', variables: [] }] }
        : ev
    )
  );
};
```
→ State updates for nested data: creates a new array, maps over events, finds the one with matching `id`, adds a new step to it (using spread `...` to avoid mutating the original).

---

### 3. Summary

`ScenariosPage` combines a list view, a creation form with complex nested state, and an Excel import feature. It uses `useScenarios` for all data operations.

---

---

## `AuditPage.tsx`

### 1. File Role

Shows all user actions logged by the system. Features:
- Paginated table of audit entries
- Filter by action type and result (success/failure)
- Colour-coded action badges
- User avatar initials with gradient colours

---

### 2. Code Explanation (Key Parts)

**Helper functions:**
```tsx
function getInitials(value: string): string {
  // Returns first 1-2 letters of a name in uppercase
}

function hashString(value: string): number {
  // Converts a string to a number for colour selection
}

function getAvatarStyle(username: string): React.CSSProperties {
  const palettes = ['gradient-1', 'gradient-2', ...];
  return { background: palettes[hashString(username) % palettes.length] };
}
```
→ Each user gets a consistent gradient colour for their avatar, derived from their username via a simple hash function. Same username always gets the same colour.

**Pagination:**
```tsx
const totalPages = Math.ceil((auditData?.meta.total ?? 0) / pageSize);
```
→ Calculates total pages. `Math.ceil` rounds up so a partial page still counts as a page.

---

### 3. Summary

`AuditPage` renders a paginated, filterable table of audit log entries using `useAudit`. It includes helper functions for user avatar display.

---

---

## `SettingsPage.tsx`

### 1. File Role

Two-section settings page:
1. **Change Password** — current password + new password form (all users)
2. **Pending Password Reset Requests** — list with approve/reject actions (validators only)

---

### 2. Key Features

- Uses `changePasswordApi` via `useMutation` directly in the component
- Uses `usePasswordResetRequests` for the admin section
- Shows a reject modal with a reason input before rejecting a request

---

### 3. Summary

`SettingsPage` handles personal settings (password change) and admin tasks (managing password reset requests). It conditionally shows the admin section based on the user's role.

---

---

## `UsersPage.tsx`

### 1. File Role

Admin-only user management page:
- View all users in a table
- Create new users via a modal form
- Change a user's role
- Enable/disable a user's account
- Delete a user
- Review and approve/reject pending password reset requests

---

### 2. Key Features

- Uses `useUsers` for all user CRUD operations
- Uses `usePasswordResetRequests` for reset requests (same as SettingsPage)
- Each user row has dropdown menus for role and active status that call mutations on change
- The "Create User" button opens a modal form

---

### 3. Summary

`UsersPage` is the admin control panel for user management. It is protected by `<RoleRoute role="validator" />` in the router.

---

---

## Simple / Placeholder Pages

These pages are very simple — just a static card with a message.

---

### `NotFoundPage.tsx`

```tsx
export function NotFoundPage() {
  return (
    <div className="card">
      <h3>Not Found</h3>
      <p className="muted">The requested page does not exist.</p>
    </div>
  );
}
```
→ Shown when the URL doesn't match any route (the `path="*"` wildcard route).

---

### `UnauthorizedPage.tsx`

```tsx
export function UnauthorizedPage() {
  return (
    <div className="card">
      <h3>Unauthorized</h3>
      <p className="error">You do not have access to this page.</p>
    </div>
  );
}
```
→ Shown when a user tries to access a page they don't have role permission for (redirected by `RoleRoute`).

---

### `ReportsPage.tsx`

```tsx
export function ReportsPage() {
  return (
    <div className="card">
      <h3>Reports</h3>
      <p className="muted">Placeholder until backend reports router is implemented.</p>
    </div>
  );
}
```
→ A placeholder page for a feature not yet implemented.

---

### `ReportGeneratorPage.tsx`

```tsx
export function ReportGeneratorPage() {
  return (
    <div className="card">
      <h3>Report Generator</h3>
      <p className="muted">Frontend folder and route prepared. Backend reports integration will be added when reports endpoints are implemented.</p>
    </div>
  );
}
```
→ Another placeholder page for a planned feature.

---

---

## 3. React Concepts Common to All Pages

### 🔹 `useState` — The Most Important Hook

Every interactive element on a page needs state:
- Form fields → `useState('')`
- Loading indicators → `useState(false)`
- Open/closed modals → `useState(false)`
- Current page number → `useState(1)`
- Selected filters → `useState('')`

```tsx
const [isOpen, setIsOpen] = useState(false);

<button onClick={() => setIsOpen(true)}>Open Modal</button>
{isOpen ? <Modal onClose={() => setIsOpen(false)} /> : null}
```

---

### 🔹 `useEffect` — Reacting to Changes

`useEffect` lets you run code when state or props change:

```tsx
// Reset page number when filter changes:
useEffect(() => {
  setPage(1);
}, [selectedFile]);  // ← runs when selectedFile changes
```

---

### 🔹 Conditional Rendering

React pages show/hide parts of the UI based on conditions:

```tsx
{isLoading ? <Loading /> : null}
{error ? <ErrorAlert message={error.message} /> : null}
{data?.length === 0 ? <EmptyState label="No items." /> : null}
{isValidator ? <AdminSection /> : null}
```

---

### 🔹 `.map()` for Lists

React renders lists by calling `.map()` on an array and returning JSX for each item:

```tsx
{imports.map((item) => (
  <tr key={item.file_id}>
    <td>{item.file.file_name}</td>
    <td>{item.uploaded_at}</td>
  </tr>
))}
```

The `key` prop is required — React uses it to efficiently update only changed list items instead of re-rendering everything.

---

## 4. Folder Summary

| Page | Complexity | Main Hook(s) | Key Feature |
|------|-----------|--------------|-------------|
| `LoginPage` | Medium | `useAuth` | Login form + forgot password modal |
| `DashboardPage` | Medium | `useDashboard`, `useAuthContext` | Role-conditional dashboard widgets |
| `ImportsPage` | High | `useImports` | Drag-and-drop upload, filter, download |
| `EventsPage` | Very High | `useEvents`, `useImports` | Multi-view, pagination, speed graph, export |
| `ScenariosPage` | High | `useScenarios` | Nested form editor, Excel import |
| `AuditPage` | Medium | `useAudit` | Paginated filtered table |
| `SettingsPage` | Medium | `usePasswordResetRequests` | Password change + admin reset management |
| `UsersPage` | High | `useUsers`, `usePasswordResetRequests` | Full user CRUD + reset approval |
| `NotFoundPage` | Minimal | — | Static card |
| `UnauthorizedPage` | Minimal | — | Static card |
| `ReportsPage` | Minimal | — | Placeholder |
| `ReportGeneratorPage` | Minimal | — | Placeholder |
