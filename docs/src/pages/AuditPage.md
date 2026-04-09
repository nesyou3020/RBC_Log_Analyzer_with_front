# `AuditPage.tsx` — Detailed Documentation

> **File location:** `frontend/src/pages/AuditPage.tsx`
> **Route:** `/audit`
> **Access:** All logged-in users

---

## 1. File Role

`AuditPage` is the **Audit Logs screen**.

It shows a table of every action ever recorded in the system:
- **Who** did it — username with a colour-coded avatar
- **What** they did — action badge (CREATE / UPDATE / DELETE / VIEW / EXPORT)
- **What it affected** — resource type (File, User, Scenario, Report, System)
- **Details** — a human-readable description like "Imported log_2024.xml"
- **When** — a formatted timestamp like "2024-01-15 14:32 (Today)"

Users can **filter** the table by user, action type, resource, and date.
The table is **paginated** — 10 rows at a time.

---

## 2. Full Code

```tsx
import { useMemo, useState } from 'react';
import { useAudit } from '../hooks/useAudit';

type ActionView = 'create' | 'update' | 'delete' | 'view' | 'export';

function getInitials(value: string): string { ... }
function hashString(value: string): number { ... }
function getAvatarStyle(username: string): React.CSSProperties { ... }
function mapActionType(action: string): ActionView { ... }
function resourceFromMeta(action: string, meta: Record<string, unknown>): string { ... }
function toDetails(action: string, meta: Record<string, unknown>): string { ... }
function toActionLabel(action: string): string { ... }
function actionIcon(action: string): string { ... }
function formatTimestamp(value: string): string { ... }

export function AuditPage() { ... }
```

The full source is at `frontend/src/pages/AuditPage.tsx`.

---

## 3. Line-by-Line Explanation

### IMPORTS

**Line 1:** `import { useMemo, useState } from 'react';`
→ Imports two built-in React tools:
- `useState` — stores a value that, when changed, automatically re-renders the screen.
- `useMemo` — caches an expensive calculation so it only re-runs when its inputs change.

**Line 2:** `import { useAudit } from '../hooks/useAudit';`
→ Imports the custom `useAudit` hook. This hook fetches audit logs from the backend and returns them along with loading/error status.
`'../hooks/useAudit'` means: go up one folder from `pages/`, then look inside `hooks/`.

---

### TYPE DEFINITION

**Line 4:** `type ActionView = 'create' | 'update' | 'delete' | 'view' | 'export';`
→ Defines a TypeScript **union type**.
A variable of type `ActionView` can only ever hold one of these five exact strings. TypeScript will give an error if you accidentally use any other value (e.g., `'delet'` with a typo).
The `|` symbol means "OR".

---

### HELPER FUNCTION: `getInitials`

**Line 6:** `function getInitials(value: string): string {`
→ Defines a function that takes a `value` (a string) and returns a string — the user's initials.
The `: string` after the closing parenthesis is TypeScript saying "this function returns a string".

**Line 7:** `const cleaned = value.trim();`
→ Removes leading and trailing spaces.
Example: `"  alice  "` becomes `"alice"`.

**Lines 8–10:**
```
if (!cleaned) {
  return 'U';
}
```
→ If `cleaned` is empty, return `'U'` (fallback for "Unknown").
`!cleaned` is `true` when `cleaned` is an empty string.

**Line 11:** `const parts = cleaned.split(/\s+/).filter(Boolean);`
→ Splits the name into words, removing extra spaces.
- `split(/\s+/)` splits on one or more whitespace characters. `"John  Smith"` → `["John", "", "Smith"]`
- `.filter(Boolean)` removes empty strings → `["John", "Smith"]`

**Lines 12–14:**
```
if (parts.length === 1) {
  return parts[0].slice(0, 2).toUpperCase();
}
```
→ Single-word name: take the first 2 characters in uppercase.
`"alice"` → `"al"` → `"AL"`

**Line 15:** `return \`${parts[0][0] ?? ''}${parts[1][0] ?? ''}\`.toUpperCase();`
→ Two+ word name: take the first character of each of the first two words.
`"John Smith"` → `"J" + "S"` → `"JS"`
The `?? ''` means: if the character doesn't exist, use an empty string instead.

---

### HELPER FUNCTION: `hashString`

**Line 18:** `function hashString(value: string): number {`
→ Converts a string into a number. Used to always give the same username the same avatar colour.

**Line 19:** `let hash = 0;`
→ Starts the hash at 0.

**Lines 20–22:**
```
for (let index = 0; index < value.length; index += 1) {
  hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
}
```
→ Loops through each character of the string.
- `value.charCodeAt(index)` converts a character to its numeric code (e.g., `'a'` = 97).
- `hash * 31 + charCode` is a classic mixing formula.
- `>>> 0` keeps the number within a 32-bit unsigned integer range (prevents overflow).

**Line 23:** `return hash;`
→ Returns the computed number.

---

### HELPER FUNCTION: `getAvatarStyle`

**Line 26:** `function getAvatarStyle(username: string): React.CSSProperties {`
→ Returns an inline CSS style object for the avatar background.
`React.CSSProperties` is the TypeScript type for CSS style objects.

**Lines 27–33:** Defines 5 gradient strings (blue, pink, teal, purple, amber).

**Line 34:** `return { background: palettes[hashString(username) % palettes.length] };`
→ Picks a gradient using the username hash.
- `hashString("alice")` → some number, e.g. 42
- `42 % 5` = 2 (remainder when dividing 42 by 5)
- `palettes[2]` = the teal gradient
- Returns `{ background: 'linear-gradient(...)' }` as inline CSS

The same username always produces the same hash → always gets the same gradient colour.

---

### HELPER FUNCTION: `mapActionType`

**Line 37:** `function mapActionType(action: string): ActionView {`
→ Converts a raw backend action string (e.g., `"import_file"`) into one of the 5 `ActionView` categories.

**Lines 38–40:** If the string contains "remove" or "delete" → return `'delete'`.
**Lines 41–43:** If it contains "download" or "export" → return `'export'`.
**Lines 44–46:** If it contains "import" or "create" → return `'create'`.
**Lines 47–49:** If it contains "save", "validate", or "update" → return `'update'`.
**Line 50:** Default → return `'view'`.

---

### HELPER FUNCTION: `resourceFromMeta`

**Line 53:** `function resourceFromMeta(action: string, meta: Record<string, unknown>): string {`
→ Figures out what type of resource was involved (File, User, Scenario, Report, or System).
`meta` is the extra data attached to the audit log entry — it's a flexible object.
`Record<string, unknown>` means "an object whose keys are strings and values can be anything".

**Lines 54–56:** If meta has `file_name` or `file_id` as a string → `'File'`.
**Lines 57–60:** If meta has user-related fields or the action mentions "user" → `'User'`.
**Lines 61–63:** If action mentions "scenario" or meta has `scenario_id` → `'Scenario'`.
**Lines 64–65:** If action mentions "report" → `'Report'`.
**Line 66:** Default → `'System'`.

---

### HELPER FUNCTION: `toDetails`

**Line 68:** `function toDetails(action: string, meta: Record<string, unknown>): string {`
→ Produces a human-readable detail string for the audit table row.
Example: `action = "import_file"`, `meta.file_name = "log.xml"` → `"Imported log.xml"`.

**Lines 69–71:** Safely reads `file_name`, `reason`, and `username` from meta (using ternary operators to handle missing values).

**Lines 73–75:** If we have a file name and the action is an import → `"Imported log.xml"`.
**Lines 76–78:** Download → `"Downloaded log.xml"`.
**Lines 79–81:** Remove → `"Deleted log.xml"`.
**Lines 82–84:** If there is a username AND a reason → `"reason text (username)"`.
The `reason.split('_').join(' ')` replaces underscores with spaces: `"password_reset"` → `"password reset"`.
**Lines 85–87:** If only a reason → just the reason text.
**Lines 88–90:** Final fallback: split the action on underscores, capitalise each word, join with spaces.
`"import_file"` → `["import", "file"]` → `["Import", "File"]` → `"Import File"`.

---

### HELPER FUNCTION: `toActionLabel`

**Lines 92–94:**
```
function toActionLabel(action: string): string {
  return mapActionType(action).toUpperCase();
}
```
→ Returns the action category in uppercase for display in the badge.
`"import_file"` → `mapActionType` → `"create"` → `.toUpperCase()` → `"CREATE"`.

---

### HELPER FUNCTION: `actionIcon`

**Line 96:** `function actionIcon(action: string): string {`
→ Returns a Font Awesome CSS class for the action's icon.

Font Awesome is an icon library loaded globally. Writing `className="fas fa-plus"` renders a "+" icon.

**Line 97:** `const type = mapActionType(action);`
→ Gets the action category.

**Lines 98–102:**
- `create` → `'fas fa-plus'` (a + sign)
- `update` → `'fas fa-pen'` (a pen/edit icon)
- `delete` → `'fas fa-trash'` (a rubbish bin)
- `export` → `'fas fa-download'` (a download arrow)
- default → `'fas fa-eye'` (an eye/view icon)

---

### HELPER FUNCTION: `formatTimestamp`

**Line 105:** `function formatTimestamp(value: string): string {`
→ Formats a raw ISO timestamp into a readable string like `"2024-01-15 14:32 (Today)"`.

**Line 106:** `const date = new Date(value);`
→ Parses the string into a JavaScript Date object.

**Lines 107–109:** Safety check: if parsing failed, `date.getTime()` returns `NaN` (Not a Number). In that case, return the original string unchanged.

**Lines 111–114:** Calculates how many days ago the timestamp was.
- `today` and `then` are both set to midnight to compare just the date (ignoring time).
- `86400000` = milliseconds per day (1000 × 60 × 60 × 24).
- `Math.round(...)` gives whole days.

**Line 116:** Builds the `"YYYY-MM-DD HH:MM"` string.
- `date.getMonth() + 1` because `getMonth()` is 0-indexed (January = 0).
- `String(...).padStart(2, '0')` ensures two digits: `"5"` → `"05"`.

**Lines 120–125:**
- `diffDays === 0` → append `"(Today)"`
- `diffDays === 1` → append `"(Yesterday)"`
- Otherwise → append `"(N days ago)"`

---

### MAIN COMPONENT: `AuditPage`

**Line 127:** `export function AuditPage() {`
→ The main React component. `export` makes it available to the router.

---

#### React Concept: What is a Component?

A **component** is a JavaScript function that returns JSX — the HTML-like syntax React renders.

```tsx
function Hello() {
  return <h1>Hello world!</h1>;
}

// Used like an HTML tag:
<Hello />
```

`AuditPage` is a component. When the router navigates to `/audit`, React calls this function and displays whatever JSX it returns.

---

**Lines 128–132:** Creates 5 state variables:

```tsx
const [userFilter, setUserFilter] = useState('');
const [actionFilter, setActionFilter] = useState('');
const [resourceFilter, setResourceFilter] = useState('');
const [dateFilter, setDateFilter] = useState('');
const [page, setPage] = useState(1);
```

| State variable | Initial | Purpose |
|----------------|---------|---------|
| `userFilter` | `''` | Selected user in the filter dropdown |
| `actionFilter` | `''` | Selected action type |
| `resourceFilter` | `''` | Selected resource type |
| `dateFilter` | `''` | Selected date |
| `page` | `1` | Current page number |

---

#### React Concept: `useState`

```tsx
const [value, setValue] = useState(initialValue);
```

- `value` — the current value (read-only inside the component)
- `setValue(x)` — updates the value AND triggers a re-render
- `initialValue` — the starting value

Example:
```tsx
const [count, setCount] = useState(0);

<button onClick={() => setCount(count + 1)}>
  Clicked {count} times
</button>
```

Each click calls `setCount`, React re-renders, and the button text updates.

---

**Line 133:** `const pageSize = 10;`
→ How many rows to show per page. This is a plain constant, not state — it never changes.

**Line 135:** `const audit = useAudit({ page: 1, pageSize: 200 });`
→ Fetches up to 200 audit log entries from the server (all at once). The page-by-page UI is done on the client side by slicing this array — it does NOT make a new server request for each page.

**Line 136:** `const logs = audit.list.data?.data ?? [];`
→ Extracts the array of log entries from the response.
- `audit.list.data` — the full API response object
- `?.data` — safely access the `.data` property (optional chaining — no crash if undefined)
- `?? []` — if the result is null/undefined, use an empty array as default

---

#### React Concept: Optional Chaining (`?.`)

```tsx
const x = obj?.property;
```

If `obj` is `null` or `undefined`, this returns `undefined` instead of throwing a `TypeError`.
Without it, accessing a property on `null` would crash.

---

**Lines 138–141:** `userOptions` — the list of unique usernames for the User dropdown.

```tsx
const userOptions = useMemo(() => {
  const names = new Set(logs.map((item) => item.username || 'Unknown'));
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}, [logs]);
```

- `logs.map(...)` — creates an array of all usernames
- `new Set(...)` — removes duplicates (a Set has no duplicate values)
- `Array.from(names)` — converts Set back to array
- `.sort((a, b) => a.localeCompare(b))` — alphabetical sort (handles accented letters correctly)

The `[logs]` dependency means: re-run only when `logs` changes.

---

#### React Concept: `useMemo`

```tsx
const result = useMemo(() => computation(), [dep1, dep2]);
```

Caches the result of `computation()`. Only re-runs when `dep1` or `dep2` change.

Without `useMemo`, the filter and unique-username logic would re-run on every render — even for unrelated state changes. With `useMemo`, it re-runs only when the data or filters actually change.

---

**Lines 143–152:** `filteredLogs` — the logs that pass all 4 filters.

```tsx
const filteredLogs = useMemo(() => {
  return logs.filter((item) => {
    const byUser = !userFilter || item.username === userFilter;
    const byAction = !actionFilter || mapActionType(item.action) === actionFilter;
    const byResource = !resourceFilter || resourceFromMeta(item.action, item.meta).toLowerCase() === resourceFilter.toLowerCase();
    const byDate = !dateFilter || new Date(item.timestamp).toISOString().slice(0, 10) === dateFilter;
    return byUser && byAction && byResource && byDate;
  });
}, [logs, userFilter, actionFilter, resourceFilter, dateFilter]);
```

Each `by*` variable is `true` when either:
- The filter is empty (`!userFilter` etc.) — meaning "no filter applied"
- OR the item matches the filter value

The `&&` at the end means ALL four conditions must be true for a row to appear.

---

**Line 154:** `const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));`
→ Calculates the total number of pages.
- `23 results / 10 per page = 2.3` → `Math.ceil(2.3) = 3` (round up)
- `Math.max(1, 3) = 3` (ensure at least 1 page)

**Line 155:** `const safePage = Math.min(page, totalPages);`
→ Ensures the current page number doesn't exceed the last page.
If you were on page 5 and then filtered down to only 2 pages, `safePage` becomes 2.

**Line 156:** `const pageStart = (safePage - 1) * pageSize;`
→ Index of the first item on the current page.
- Page 1: `0 * 10 = 0`
- Page 2: `1 * 10 = 10`
- Page 3: `2 * 10 = 20`

**Line 157:** `const pageLogs = filteredLogs.slice(pageStart, pageStart + pageSize);`
→ Extracts the 10 items for the current page.
`.slice(start, end)` returns items from index `start` up to (not including) `end`.

**Line 159:** `const latestSync = logs.length > 0 ? new Date(logs[0].timestamp).toLocaleString() : '-';`
→ Shows the timestamp of the most recent log as "last updated" time.
`toLocaleString()` formats as a locale-appropriate date/time string.

---

### CSS STYLES (Lines 161–236)

```tsx
const pageStyles = `
  .admin-header { ... }
  .audit-filters { ... }
  .action-badge { ... }
  ...
`;
```
→ Defines CSS as a string, injected into the page via `<style>{pageStyles}</style>` in the JSX.

Key style classes:
- `.admin-header` — the red "Admin" restricted-area banner
- `.admin-badge` — the "Admin" pill label inside the banner
- `.audit-filters` — flex row containing the 4 filter groups
- `.filter-group` — wrapper for one filter (label + input)
- `.filter-input` — the dropdown/date input styling
- `.action-badge` — the coloured pill showing the action category
- `.action-create/update/delete/view/export` — colour variants:
  - create → green
  - update → blue
  - delete → red
  - view → orange
  - export → purple
- `.user-info` — flex row: avatar + username
- `.user-avatar` — small coloured square with initials

---

### JSX RETURN (Lines 238 onward)

```tsx
return (
  <>
    <style>{pageStyles}</style>
    ...
  </>
);
```
→ `<>...</>` is a **React Fragment** — groups multiple elements without adding a real DOM element.

**Page header:**
```tsx
<h2>Audit Logs</h2>
<p>Track all system activities and user actions</p>
<button onClick={() => window.alert('Exporting audit logs...')}>Export</button>
```
→ Title on the left, Export button on the right. The Export button shows a browser alert (placeholder — real export not yet implemented).

**Admin banner:**
```tsx
<div className="admin-header">
  <span className="admin-badge"><i className="fas fa-shield-alt"></i> Admin</span>
  <span className="admin-text">This section is restricted to administrators only...</span>
</div>
```
→ A red banner indicating admin-only content.

**Filter row:**
```tsx
<select value={userFilter} onChange={(event) => { setUserFilter(event.target.value); setPage(1); }}>
  <option value="">All Users</option>
  {userOptions.map((name) => <option key={name} value={name}>{name}</option>)}
</select>
```
→ A controlled dropdown for the user filter.
- `value={userFilter}` — React controls what the dropdown displays.
- `onChange` — updates `userFilter` state AND resets `page` to 1 (so you start fresh after filtering).
- `{userOptions.map(...)}` — dynamically renders one `<option>` per unique username.

**Table:**
```tsx
{pageLogs.map((item) => (
  <tr key={item.audit_id}>
    <td><div className="user-avatar" style={getAvatarStyle(item.username)}>{getInitials(item.username)}</div>...</td>
    <td><span className={`action-badge action-${mapActionType(item.action)}`}>{toActionLabel(item.action)}</span></td>
    <td>{resourceFromMeta(item.action, item.meta)}</td>
    <td>{toDetails(item.action, item.meta)}</td>
    <td>{formatTimestamp(item.timestamp)}</td>
  </tr>
))}
```
→ Renders one `<tr>` per log entry on the current page.
- `key={item.audit_id}` — required unique key for React's list rendering.
- `style={getAvatarStyle(item.username)}` — applies the gradient colour to the avatar.
- `className={\`action-badge action-${mapActionType(item.action)}\`}` — dynamically applies the colour class.

**Pagination:**
```tsx
<button onClick={() => setPage((v) => Math.max(1, v - 1))} disabled={safePage <= 1}>← Previous</button>

{Array.from({ length: totalPages }).slice(0, 5).map((_, index) => (
  <button key={index + 1}
          className={index + 1 === safePage ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
          onClick={() => setPage(index + 1)}>
    {index + 1}
  </button>
))}

<button onClick={() => setPage((v) => Math.min(totalPages, v + 1))} disabled={safePage >= totalPages}>Next →</button>
```
→ Previous/Next buttons plus numbered page buttons (up to 5 shown).
- `disabled={safePage <= 1}` — grays out Previous on the first page.
- `Array.from({ length: totalPages })` — creates an array with `totalPages` entries.
- The current page's button gets `btn-primary` (blue), others get `btn-secondary`.

---

## 4. React Concepts Summary

| Concept | Where used in AuditPage |
|---------|------------------------|
| `useState` | 5 filter/page state variables |
| `useMemo` | `userOptions` (unique names) and `filteredLogs` (filtered results) |
| Controlled inputs | All 4 filter dropdowns (value + onChange) |
| Conditional rendering | Loading message, error message, "no results" row |
| List rendering (`.map()`) | Table rows, page buttons, user dropdown options |
| Optional chaining (`?.`) | `audit.list.data?.data` |
| Nullish coalescing (`??`) | `audit.list.data?.data ?? []` |
| Inline CSS | `style={getAvatarStyle(...)}`, page header layout |
| React Fragment (`<>`) | Wrapping the return without an extra div |

---

## 5. Summary

`AuditPage.tsx` is a read-only audit trail page. In plain language:

1. When the page loads, `useAudit` fetches up to 200 log records from the backend.
2. The records are stored in `logs`.
3. Five `useState` variables track the current filter selections and page number.
4. `useMemo` computes the filtered list whenever the data or filters change.
5. The filtered list is sliced into pages of 10 rows.
6. The table is rendered using `.map()` — one row per record.
7. Each row uses helper functions to display a colour-coded avatar, a styled action badge, the resource type, a readable detail string, and a human-friendly timestamp.
8. Pagination buttons at the bottom let the user navigate between pages.

The file never makes API calls directly — all data fetching is handled by the `useAudit` hook.
