# `src/types/` — Documentation

> **Folder location:** `frontend/src/types/`

This folder contains **TypeScript type definitions** — blueprints that describe the exact shape of data objects used throughout the app.

TypeScript uses these definitions to:
- Warn you if you access a property that doesn't exist
- Warn you if you pass the wrong type of value to a function
- Give you autocomplete in your editor

Files:
- `api.ts` — Generic API response types
- `audit.ts` — Audit log types
- `dashboard.ts` — Dashboard summary types
- `event.ts` — Event types
- `import.ts` — Import (log file) types
- `scenario.ts` — Scenario types
- `user.ts` — User types
- `index.ts` — Re-exports everything for easy importing

---

## `api.ts`

### 1. File Role

Defines two types used by every API response in the project.

---

### 2. Code Explanation (Line by Line)

```ts
Line 1: export type ApiEnvelope<T> = {
Line 2:   data: T;
Line 3: };
```
→ Defines a **generic type** called `ApiEnvelope`. Every successful API response from the backend is wrapped in this shape: `{ data: ... }`.

The `<T>` is a **type parameter** — a placeholder for whatever type of data the response contains. For example:
- `ApiEnvelope<LogImport[]>` → `{ data: LogImport[] }` (a list of imports)
- `ApiEnvelope<LoginResponse>` → `{ data: LoginResponse }` (a login response)

---

```ts
Line 5: export type ApiErrorShape = {
Line 6:   detail?: string;
Line 7: };
```
→ Defines the shape of API **error responses** from the backend.
When the backend returns an error, the response body contains `{ detail: "Error message here" }`.
The `?` makes `detail` optional (some errors might not include it).

---

### 3. Concepts

#### 🔹 Generic Types (`<T>`)

A generic type is like a **template** that works with any type:

```ts
type ApiEnvelope<T> = { data: T };

// Using it with different types:
type ImportResponse = ApiEnvelope<LogImport[]>;
// → { data: LogImport[] }

type LoginResponse = ApiEnvelope<{ token: string }>;
// → { data: { token: string } }
```

Without generics, you would have to write a separate type for every possible response shape.

---

## `audit.ts`

### 1. File Role

Defines types for the Audit Log feature — the log of all user actions in the system.

---

### 2. Code Explanation (Line by Line)

```ts
Lines 1–9:
export type AuditLogItem = {
  audit_id: string;
  timestamp: string;
  user_id: string;
  username: string;
  action: string;
  result: 'success' | 'failure';
  meta: Record<string, unknown>;
};
```
→ Defines the shape of a **single audit log entry**.

- `audit_id` — Unique identifier for this log entry
- `timestamp` — When the action happened (ISO date string)
- `user_id` — The ID of the user who performed the action
- `username` — The username of that user
- `action` — What they did (e.g., `"import_file"`, `"delete_import"`)
- `result: 'success' | 'failure'` — A **union type**: this value can only be exactly `"success"` or `"failure"`, nothing else
- `meta: Record<string, unknown>` — Extra details about the action (flexible key-value pairs)

---

```ts
Lines 11–15:
export type AuditListMeta = {
  page: number;
  page_size: number;
  total: number;
};
```
→ Pagination metadata for the audit log list.
- `page` — Current page number
- `page_size` — Items per page
- `total` — Total number of audit entries in the database

---

```ts
Lines 17–20:
export type AuditListResponse = {
  data: AuditLogItem[];
  meta: AuditListMeta;
};
```
→ The full shape of the audit list API response: a list of items plus pagination info.

---

## `dashboard.ts`

### 1. File Role

Defines the shape of the data returned by the Dashboard API endpoint.

---

### 2. Code Explanation (Line by Line)

```ts
export type DashboardSummary = {
  stats: {
    files_uploaded: number;
    reports_generated: number;
    scenarios_created: number;
    users_active: number;
  };
```
→ The four statistics shown as cards on the Dashboard page.

---

```ts
  pending_password_resets: Array<{
    request_id: string;
    username: string;
    role: string;
    created_at: string;
  }>;
```
→ A list of pending password reset requests (visible to admin/validator users only).

---

```ts
  recent_files: Array<{
    file_id: string;
    file_name: string;
    uploaded_at: string;
    username: string;
  }>;
```
→ A list of recently uploaded files shown on the dashboard.

---

```ts
  recent_activity: Array<{
    audit_id: string;
    timestamp: string;
    username: string;
    action: string;
    meta: Record<string, unknown>;
  }>;
```
→ A list of recent user actions shown on the dashboard.

---

```ts
  is_validator: boolean;
};
```
→ Whether the logged-in user is a validator (admin). Used to show/hide admin-only sections.

---

## `event.ts`

### 1. File Role

Defines types for the Events feature — browsing events from a log file.

---

### 2. Code Explanation (Line by Line)

```ts
Line 1: export type EventMode = 'with_24_136' | 'without_24_136';
```
→ A union type for the two modes of event display. The values correspond to backend processing modes related to specific message codes.

---

```ts
Lines 3–9:
export type EventRow = {
  index?: number;
  timestamp?: string;
  train_id?: string | number;
  message_code?: string;
  message_name?: string;
  raw?: Record<string, unknown>;
  [key: string]: unknown;
};
```
→ Represents a single row/event from the log file.

All fields are optional (`?`) because log files vary — not every event has every field.
`[key: string]: unknown` is an **index signature** — it means this object can have any additional keys with any values (for flexible log data).

---

```ts
Lines 11–14:
export type TrainListResponse = {
  file_id: string;
  train_ids: Array<string | number>;
};
```
→ The response from the "list trains in this file" API endpoint. Contains the file ID and a list of train identifiers found in that file.

---

```ts
Lines 16–23:
export type EventListResponse = {
  file_id: string;
  mode: EventMode;
  items: EventRow[];
  page: number;
  page_size: number;
  total: number;
};
```
→ The paginated response from the "list events" API endpoint.

---

```ts
Lines 25–31:
export type RawEventsResponse = {
  file_id: string;
  items: Record<string, unknown>[];
  page: number;
  page_size: number;
  total: number;
};
```
→ Similar to `EventListResponse` but for raw (unprocessed) events. Each item is a plain key-value object.

---

## `import.ts`

### 1. File Role

Defines types for the log file import feature.

---

### 2. Code Explanation (Line by Line)

```ts
Lines 1–6:
export type FileMeta = {
  file_name: string;
  file_path: string;
  file_size: number;
  file_hash: string;
};
```
→ Metadata about the physical file:
- `file_name` — The original filename (e.g., `"log_2024_01_15.xml"`)
- `file_path` — Where it is stored on the server
- `file_size` — Size in bytes
- `file_hash` — A checksum to verify file integrity

---

```ts
Lines 8–15:
export type LogImport = {
  file_id: string;
  user_id: string;
  created_by_username?: string | null;
  uploaded_at: string;
  error_message: string | null;
  version: string | null;
  file: FileMeta;
};
```
→ Represents a full import record:
- `file_id` — Unique identifier for this import
- `user_id` — Who uploaded it
- `created_by_username` — Display name of the uploader (optional)
- `uploaded_at` — When it was uploaded
- `error_message` — Error during processing (or `null` if successful)
- `version` — Log file version (or `null` if not detected)
- `file` — The nested `FileMeta` object with file details

---

## `scenario.ts`

### 1. File Role

Defines types for the Scenarios feature — test templates that describe expected event sequences.

---

### 2. Code Explanation (Line by Line)

```ts
Lines 1–4:
export type ScenarioStep = {
  type: string;
  [key: string]: string;
};
```
→ A single step in a scenario (e.g., "send message X"). Has a `type` and any number of additional key-value string properties.

---

```ts
Lines 6–10:
export type OperationalScenario = {
  index: number;
  name: string;
  steps: ScenarioStep[];
};
```
→ A named sequence of steps. A scenario template can contain multiple operational scenarios.

---

```ts
Lines 12–19:
export type ScenarioTemplate = {
  template_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_by_username?: string | null;
  created_at: string;
  operational_scenarios: OperationalScenario[];
};
```
→ A full scenario template as stored in the database.

---

```ts
Lines 21–25:
export type CreateScenarioPayload = {
  name: string;
  description?: string;
  operational_scenarios: OperationalScenario[];
};
```
→ The data sent to the backend when creating a new scenario.

---

## `user.ts`

### 1. File Role

Defines types related to users and authentication.

---

### 2. Code Explanation (Line by Line)

```ts
Line 1: export type UserRole = 'validator' | 'engineer';
```
→ A union type for the two user roles. A user can only be either a `"validator"` (admin) or an `"engineer"` (standard user).

---

```ts
Lines 3–9:
export type UserPublic = {
  user_id: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
};
```
→ The publicly visible information about a user (as returned by the API). Does not include the password.

---

```ts
Lines 11–16:
export type LoginResponse = {
  token: string;
  user_id: string;
  username: string;
  role: UserRole;
};
```
→ The data returned by the backend after a successful login:
- `token` — The JWT token to include in future requests
- `user_id`, `username`, `role` — User info stored in the auth context

---

```ts
Lines 18–22:
export type CreateUserRequest = {
  username: string;
  password: string;
  role: UserRole;
};
```
→ The payload sent to the backend when creating a new user.

---

## `index.ts`

### 1. File Role

Re-exports all types from all other type files so you can import from one place.

---

### 2. Code Explanation (Line by Line)

```ts
Line 1: export * from './api';
Line 2: export * from './audit';
Line 3: export * from './dashboard';
Line 4: export * from './event';
Line 5: export * from './import';
Line 6: export * from './scenario';
Line 7: export * from './user';
```

Each `export * from '...'` re-exports everything from that file.

Without `index.ts`:
```ts
import { LogImport } from '../types/import';
import { UserPublic } from '../types/user';
import { AuditLogItem } from '../types/audit';
```

With `index.ts`:
```ts
import { LogImport, UserPublic, AuditLogItem } from '../types';
```

Much cleaner! You only need to remember one import path.

---

## 3. React/TypeScript Concepts

### 🔹 What is a Type?

A TypeScript `type` is a **blueprint** that describes the shape of a value:

```ts
type User = {
  id: string;
  name: string;
  age: number;
};

const alice: User = {
  id: '1',
  name: 'Alice',
  age: 30
};

// TypeScript error — 'age' should be a number:
const bob: User = { id: '2', name: 'Bob', age: 'thirty' }; // ❌
```

---

### 🔹 Union Types (`'a' | 'b'`)

A union type means "this value can be one of these specific values":

```ts
type UserRole = 'validator' | 'engineer';

// ✅ OK:
const role: UserRole = 'validator';
const role: UserRole = 'engineer';

// ❌ Error:
const role: UserRole = 'admin'; // Not allowed
```

This prevents typos and restricts what values are valid.

---

### 🔹 Optional Properties (`?`)

Adding `?` to a property makes it optional — the object can have it or not:

```ts
type LogImport = {
  file_id: string;              // required
  error_message: string | null; // required (but can be null)
  version: string | null;       // required (but can be null)
  created_by_username?: string; // optional (may not exist)
};
```

---

## 4. Summary

The `types/` folder defines the shape of all data objects in the app. Each file corresponds to a feature domain (users, events, imports, etc.). The `index.ts` barrel file re-exports everything so other files can import from `'../types'` instead of from individual type files.

Types have no runtime effect — they are erased when TypeScript compiles to JavaScript. Their job is to help you (and your editor) catch mistakes before the code runs.
