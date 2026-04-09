# `src/services/` — Documentation

> **Folder location:** `frontend/src/services/`

This folder handles **all communication with the backend server**.

Structure:
```
services/
├── storage.ts        ← Saves/reads token and user from the browser
└── api/
    ├── client.ts     ← Core HTTP request function (used by all API files)
    ├── endpoints.ts  ← All backend URL paths in one place
    ├── auth.api.ts   ← Login, logout, password reset API calls
    ├── audit.api.ts  ← Audit log API calls
    ├── dashboard.api.ts ← Dashboard summary API call
    ├── events.api.ts ← Events API calls
    ├── imports.api.ts ← File import API calls
    ├── scenarios.api.ts ← Scenarios API calls
    └── users.api.ts  ← User management API calls
```

---

## `storage.ts`

### 1. File Role

`storage.ts` handles **persisting the login session** in the browser.

After login, the backend gives us a **JWT token** and user information. We need to save these so the user stays logged in even after refreshing the page. This file manages reading and writing those values to `localStorage` or `sessionStorage`.

---

### 2. Code Explanation (Line by Line)

```ts
Line 1: import { LoginResponse } from '../types';
```
→ Imports the `LoginResponse` type (shape of the user data returned after login).

---

```ts
Line 3: export type AuthStorageMode = 'localStorage' | 'sessionStorage';
```
→ Defines a type for the two storage modes:
- `'localStorage'` — Persists across browser closes ("Remember Me")
- `'sessionStorage'` — Cleared when the browser tab closes (more secure)

---

```ts
Lines 5–7:
const TOKEN_KEY = 'rbc_token';
const USER_KEY = 'rbc_user';
const STORAGE_MODE_KEY = 'rbc_auth_storage_mode';
```
→ Constants for the localStorage/sessionStorage keys. Using constants prevents typos.

---

```ts
Lines 9–11:
function getStorage(mode: AuthStorageMode): Storage {
  return mode === 'sessionStorage' ? sessionStorage : localStorage;
}
```
→ Returns the correct storage object based on the mode. A small helper to avoid repeating the ternary.

---

```ts
Lines 13–22:
function getPreferredStorage(): Storage {
  if (typeof window === 'undefined') {
    return localStorage;
  }
  const mode = localStorage.getItem(STORAGE_MODE_KEY) as AuthStorageMode | null;
  if (mode === 'sessionStorage') {
    return sessionStorage;
  }
  return localStorage;
}
```
→ Reads the previously saved storage preference from `localStorage` and returns the correct storage.

The storage mode preference itself is always saved in `localStorage` (even if the token is in `sessionStorage`), so we can find it on page refresh.

---

```ts
Lines 24–27:
export function setAuthStorageMode(mode: AuthStorageMode): void {
  localStorage.setItem(STORAGE_MODE_KEY, mode);
}
```
→ Saves which storage mode is active (called during login).

---

```ts
Lines 29–31:
export function getAuthStorageMode(): AuthStorageMode {
  return (localStorage.getItem(STORAGE_MODE_KEY) as AuthStorageMode | null) ?? 'localStorage';
}
```
→ Reads the saved storage mode (defaults to `'localStorage'` if not set).

---

```ts
Lines 33–37:
export function setAuthSession(token: string, user: LoginResponse, mode: AuthStorageMode): void {
  const storage = getStorage(mode);
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
  setAuthStorageMode(mode);
}
```
→ **Saves the full session after login**: token, user (serialised to JSON), and storage mode.

`JSON.stringify(user)` converts the user object to a string because `localStorage` can only store strings.

---

```ts
Lines 39–42:
export function getToken(): string | null {
  const storage = getPreferredStorage();
  return storage.getItem(TOKEN_KEY);
}
```
→ Reads the saved JWT token (used by `apiRequest` to add the `Authorization` header).

---

```ts
Lines 44–46:
export function setToken(token: string): void {
  getPreferredStorage().setItem(TOKEN_KEY, token);
}
```
→ Updates just the token (without changing the user).

---

```ts
Lines 48–51:
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}
```
→ Removes the token from **both** storages (since we don't know which one was used).

---

```ts
Lines 53–62:
export function getUser(): LoginResponse | null {
  const storage = getPreferredStorage();
  const raw = storage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as LoginResponse;
  } catch {
    return null;
  }
}
```
→ Reads the saved user object. `JSON.parse` converts the stored string back into a JavaScript object. The `try/catch` prevents a crash if the stored string is corrupted.

---

```ts
Lines 64–66: export function setUser / clearUser / clearAuthStorage
```
→ Similar helpers for writing, clearing the user, and clearing everything (called on logout).

```ts
export function clearAuthStorage(): void {
  clearToken();
  clearUser();
  localStorage.removeItem(STORAGE_MODE_KEY);
}
```
→ The full logout cleanup — removes token, user, and storage mode preference.

---

### 3. Concepts

#### 🔹 JWT (JSON Web Token)

A **JWT token** is a string the backend gives you after a successful login. It proves you are authenticated.

Every subsequent request to the backend includes this token in the `Authorization` header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5...
```

The backend verifies this token and knows who you are without needing your username/password again.

---

#### 🔹 localStorage vs sessionStorage

| Feature | `localStorage` | `sessionStorage` |
|---------|---------------|-----------------|
| Survives page refresh | ✅ Yes | ✅ Yes |
| Survives browser close | ✅ Yes | ❌ No |
| Shared across tabs | ✅ Yes | ❌ No (each tab has its own) |
| Use case | "Remember Me" | Temporary session |

This project lets the user choose: checking "Remember Me" on the login form uses `localStorage`; unchecking it uses `sessionStorage`.

---

---

## `api/client.ts`

### 1. File Role

`client.ts` is the **core HTTP request function** used by every API file in the project.

It is a wrapper around the browser's built-in `fetch` function that automatically:
- Adds the `Authorization` header with the JWT token
- Sets `Content-Type: application/json` for JSON bodies
- Parses the response as JSON
- Throws an `ApiError` if the request fails
- Clears the session if the server responds with 401/403 (token expired)

---

### 2. Code Explanation (Line by Line)

```ts
Lines 1–3: imports
```
→ Imports `env` (for the base URL), `ApiErrorShape` (for error response type), and storage functions.

---

```ts
Lines 5–10:
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
```
→ Defines a custom error class `ApiError` that extends the built-in JavaScript `Error`.

It adds a `status` property (the HTTP status code: 401, 404, 500, etc.). This lets callers distinguish "not found" from "server error" from "unauthorised":

```ts
if (error instanceof ApiError && error.status === 401) {
  // Handle unauthorised
}
```

---

```ts
Lines 12–17:
type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: BodyInit | Record<string, unknown>;
  headers?: Record<string, string>;
  auth?: boolean;
};
```
→ The options you can pass to `apiRequest`. All fields are optional:
- `method` → HTTP method (default: `'GET'`)
- `body` → Request body (can be an object for JSON or `FormData` for file uploads)
- `headers` → Extra headers to add
- `auth` → Whether to add the `Authorization` header (default: `true`)

---

```ts
Line 19: export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
```
→ The main function. It is:
- `async` — It performs network requests, which take time. `async` allows using `await` inside.
- Generic `<T>` — The caller specifies what type the response data should be.
- Returns `Promise<T>` — A Promise that resolves to the parsed response data.

---

```ts
Line 20: const { method = 'GET', body, headers = {}, auth = true } = options;
```
→ **Destructuring with defaults**. Unpacks the `options` object and sets default values:
- `method` defaults to `'GET'`
- `auth` defaults to `true`

---

```ts
Lines 25–35: body processing
```
→ Handles different body types:
- If `body` is a `FormData` (for file uploads) → pass it directly
- If `body` is a plain object → convert to JSON string and set `Content-Type: application/json`
- Otherwise → pass as-is

---

```ts
Lines 37–41:
if (auth) {
  const token = getToken();
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }
}
```
→ If `auth` is `true` (the default), reads the saved JWT token and adds it as the `Authorization` header. Public endpoints like login set `auth: false` to skip this.

---

```ts
Lines 43–47:
const response = await fetch(`${env.apiBaseUrl}${path}`, {
  method,
  headers: requestHeaders,
  body: requestBody
});
```
→ Makes the actual HTTP request using the browser's built-in `fetch` function.
The URL is `env.apiBaseUrl` (e.g. `http://localhost:8000`) + `path` (e.g. `/imports`).

---

```ts
Lines 49–50:
const text = await response.text();
const parsed = text ? (JSON.parse(text) as unknown) : {};
```
→ Reads the response body as text first (safer than `response.json()` which crashes on empty responses), then parses it as JSON.

---

```ts
Lines 52–58:
if (!response.ok) {
  const errorBody = parsed as ApiErrorShape;
  if (auth && (response.status === 401 || response.status === 403)) {
    clearAuthStorage();
  }
  throw new ApiError(errorBody.detail ?? 'Request failed', response.status);
}
```
→ If the HTTP status is not 2xx (success):
1. If it's 401 (Unauthorised) or 403 (Forbidden), clear the saved token/user (the session is invalid).
2. Throw an `ApiError` with the error message from the backend and the HTTP status code.

---

```ts
Line 60: return parsed as T;
```
→ Returns the parsed JSON response cast to type `T`.

---

### 3. Concepts

#### 🔹 `async` / `await`

Network requests take time (milliseconds to seconds). JavaScript is single-threaded — without async, it would freeze the whole page while waiting.

`async`/`await` lets you write asynchronous code that reads like synchronous code:

```ts
// Without async/await (callback style — hard to read):
fetch(url).then(response => {
  response.json().then(data => {
    console.log(data);
  });
});

// With async/await (clean and readable):
const response = await fetch(url);
const data = await response.json();
console.log(data);
```

The `await` keyword pauses execution of the `async` function until the Promise resolves, without blocking the rest of the page.

---

#### 🔹 HTTP Methods

| Method | Used for |
|--------|---------|
| `GET` | Reading data (list, fetch) |
| `POST` | Creating data or actions (login, upload, create) |
| `PATCH` | Partially updating data (change role, change active status) |
| `DELETE` | Deleting data |

---

#### 🔹 HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK — request succeeded |
| `201` | Created — resource was created |
| `400` | Bad Request — you sent invalid data |
| `401` | Unauthorised — no valid token |
| `403` | Forbidden — you don't have permission |
| `404` | Not Found |
| `409` | Conflict — duplicate entry |
| `500` | Internal Server Error — backend bug |

---

---

## `api/endpoints.ts`

### 1. File Role

`endpoints.ts` is a **single source of truth for all backend API paths**.

Instead of writing `'/auth/login'` in multiple files, you write `endpoints.auth.login`. This prevents typos and makes renaming easy.

---

### 2. Code Explanation (Key Parts)

```ts
export const endpoints = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    changePassword: '/auth/change-password',
    passwordResetRequests: '/auth/password-reset-requests',
    approvePasswordReset: (requestId: string) => `/auth/password-reset-requests/${requestId}/approve`,
    rejectPasswordReset: (requestId: string) => `/auth/password-reset-requests/${requestId}/reject`
  },
  imports: {
    list: '/imports',
    create: '/imports',
    download: (fileId: string) => `/imports/${fileId}/download`,
    delete: (fileId: string) => `/imports/${fileId}`
  },
  // ... (events, dashboard, audit, scenarios, users)
};
```

Some paths are plain strings (e.g. `'/auth/login'`). Others are **functions** that generate a path with a dynamic segment (e.g. `download: (fileId) => '/imports/${fileId}/download'`).

**Why functions?** Because some endpoints need an ID in the URL. The function lets you pass the ID:
```ts
endpoints.imports.delete('abc-123')
// → '/imports/abc-123'
```

---

---

## `api/*.api.ts` — Individual API Files

Each `*.api.ts` file contains functions that call specific backend endpoints for one feature.

They all follow the same pattern:
1. Import types and the `apiRequest` function
2. Import the relevant endpoint paths from `endpoints.ts`
3. Export one function per API operation

---

### `auth.api.ts`

| Function | HTTP Method | Endpoint | Purpose |
|----------|-------------|----------|---------|
| `loginApi(payload)` | POST | `/auth/login` | Authenticate with username+password |
| `logoutApi()` | POST | `/auth/logout` | Invalidate the token on the server |
| `changePasswordApi(payload)` | POST | `/auth/change-password` | Change the current user's password |
| `submitPasswordResetRequestApi(payload)` | POST | `/auth/password-reset-requests` | Request a password reset (unauthenticated) |
| `listPasswordResetRequestsApi()` | GET | `/auth/password-reset-requests` | List pending password reset requests |
| `approvePasswordResetApi(requestId)` | POST | `/auth/password-reset-requests/:id/approve` | Admin approves a reset request |
| `rejectPasswordResetApi(requestId, reason)` | POST | `/auth/password-reset-requests/:id/reject` | Admin rejects a reset request |

Note: `loginApi` and `submitPasswordResetRequestApi` set `auth: false` because they are called before the user has a token.

---

### `imports.api.ts`

| Function | HTTP Method | Endpoint | Purpose |
|----------|-------------|----------|---------|
| `listImportsApi()` | GET | `/imports` | List all uploaded files |
| `uploadImportApi(file)` | POST | `/imports` | Upload a new XML log file |
| `deleteImportApi(fileId)` | DELETE | `/imports/:fileId` | Delete a file |
| `downloadImportApi(fileId)` | GET | `/imports/:fileId/download` | Download a file as a Blob |

`uploadImportApi` uses `FormData` because it uploads a binary file (not JSON).

`downloadImportApi` is more complex — it reads the response as a `Blob` (binary) and extracts the filename from the `Content-Disposition` header.

---

### `events.api.ts`

| Function | Purpose |
|----------|---------|
| `listTrainsApi(fileId)` | Get all train IDs found in a log file |
| `listEventsApi(params)` | Get paginated events from a file |
| `listRawEventsApi(params)` | Get raw (unprocessed) events from a file |

All three accept `file_id` as a query parameter.

---

### `dashboard.api.ts`

One function: `getDashboardSummaryApi()` — fetches the dashboard statistics, recent files, and pending resets.

---

### `audit.api.ts`

One function: `listAuditLogsApi(params)` — fetches paginated audit log entries with optional filters for `action` and `result`.

---

### `scenarios.api.ts`

| Function | Purpose |
|----------|---------|
| `listScenariosApi()` | List all scenario templates |
| `createScenarioApi(payload)` | Create a new scenario from JSON |
| `uploadScenarioExcelApi(params)` | Create a scenario from an Excel file |
| `previewScenarioExcelApi(params)` | Preview what an Excel file would import (without saving) |
| `deleteScenarioApi(templateId)` | Delete a scenario template |

---

### `users.api.ts`

| Function | Purpose |
|----------|---------|
| `listUsersApi()` | List all users |
| `createUserApi(payload)` | Create a new user |
| `setUserRoleApi(userId, role)` | Change a user's role |
| `setUserActiveApi(userId, isActive)` | Enable or disable a user |
| `deleteUserApi(userId)` | Delete a user |

---

## 4. Summary

The `services/` folder is the **communication layer** between the frontend and the backend.

| File | Role |
|------|------|
| `storage.ts` | Saves and reads the JWT token and user from the browser |
| `api/client.ts` | The core `apiRequest` function — handles auth headers, JSON parsing, error throwing |
| `api/endpoints.ts` | All backend URL paths in one place |
| `api/auth.api.ts` | Authentication-related API calls |
| `api/imports.api.ts` | File upload/download/list/delete API calls |
| `api/events.api.ts` | Events and trains API calls |
| `api/dashboard.api.ts` | Dashboard summary API call |
| `api/audit.api.ts` | Audit log API calls |
| `api/scenarios.api.ts` | Scenario CRUD API calls |
| `api/users.api.ts` | User management API calls |

The hooks in `src/hooks/` call these API functions, and React Query manages the loading/error/caching state around them.
