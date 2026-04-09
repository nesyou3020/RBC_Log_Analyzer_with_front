# `src/store/` — Documentation

> **Folder location:** `frontend/src/store/`

This folder holds **global state** — information that needs to be shared across many components throughout the entire app.

Files:
- `authContext.tsx`

---

## `authContext.tsx`

### 1. File Role

`authContext.tsx` manages **who is logged in**.

It stores:
- The **JWT token** (the "key" that proves you are logged in)
- The **user object** (username, role)
- A flag `isAuthenticated` (true if you have a valid token)

Any component anywhere in the app can access this information without passing it down through props.

---

### 2. Code Explanation (Line by Line)

```tsx
Line 1: import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
```
→ Imports React functions needed for Context:
- `createContext` — creates a Context object
- `ReactNode` — the TypeScript type for "any React content" (components, text, etc.)
- `useContext` — lets a component read from a Context
- `useMemo` — optimises by avoiding unnecessary re-computations
- `useState` — creates reactive state variables

---

```tsx
Line 2: import { LoginResponse } from '../types';
```
→ Imports the `LoginResponse` type — the shape of what the backend returns after a successful login (token, user_id, username, role).

---

```tsx
Line 3: import { AuthStorageMode, clearAuthStorage, getToken, getUser, setAuthSession } from '../services/storage';
```
→ Imports functions from `storage.ts` that read/write the token and user info from/to the browser's localStorage or sessionStorage.

---

```tsx
Lines 5–12:
type AuthState = {
  token: string | null;
  user: LoginResponse | null;
  isAuthenticated: boolean;
  storageMode: AuthStorageMode;
  setSession: (data: LoginResponse, mode?: AuthStorageMode) => void;
  clearSession: () => void;
};
```
→ Defines the TypeScript **type** (blueprint) of the context value.

The context will have:
- `token` — the JWT token string (or `null` if not logged in)
- `user` — the user object (or `null` if not logged in)
- `isAuthenticated` — `true` if a token exists
- `storageMode` — whether the token is stored in `localStorage` or `sessionStorage`
- `setSession(data, mode)` — a function to call after login (saves token + user)
- `clearSession()` — a function to call on logout (removes token + user)

---

```tsx
Line 14: const AuthContext = createContext<AuthState | undefined>(undefined);
```
→ Creates the React Context.

`createContext<AuthState | undefined>(undefined)` means:
- The context holds an `AuthState` value
- Its initial value is `undefined` (before the `AuthProvider` renders)

This is the "shared container" — components can read from it using `useContext(AuthContext)`.

---

```tsx
Lines 16–18:
type Props = {
  children: ReactNode;
};
```
→ Defines the type for the `AuthProvider` component's props.
`children: ReactNode` means the component wraps other content (like a layout wrapper).

---

```tsx
Line 20: export function AuthProvider({ children }: Props) {
```
→ Defines the `AuthProvider` component. This component wraps the whole app and makes the auth state available everywhere inside it.

---

```tsx
Line 21: const [tokenState, setTokenState] = useState<string | null>(() => getToken());
```
→ Creates a **state variable** `tokenState` for the JWT token.

`() => getToken()` is an initialiser function — on first render, it calls `getToken()` which reads the token from localStorage/sessionStorage (so if the user was logged in before and refreshed the page, they stay logged in).

---

```tsx
Line 22: const [userState, setUserState] = useState<LoginResponse | null>(() => getUser());
```
→ Same pattern for the user object. Reads the saved user from storage on first load.

---

```tsx
Line 23: const [storageMode, setStorageMode] = useState<AuthStorageMode>(() => 'localStorage');
```
→ Creates a state variable for the storage mode (localStorage vs sessionStorage). Defaults to `'localStorage'`.

---

```tsx
Lines 25–46: const value = useMemo<AuthState>(...);
```
→ Creates the context value object using `useMemo`.

`useMemo` caches the object and only recalculates it when `tokenState`, `userState`, or `storageMode` change. Without this, a new object would be created on every render, causing all consumers to re-render unnecessarily.

The `value` object contains:
- `token: tokenState` — the current token
- `user: userState` — the current user
- `isAuthenticated: Boolean(tokenState)` — `true` if token is not null/empty
- `storageMode` — current storage mode
- `setSession(data, mode)` — saves the session after login
- `clearSession()` — clears everything on logout

---

```tsx
Lines 37–42:
setSession: (data, mode = 'localStorage') => {
  setAuthSession(data.token, data, mode);   // Save to browser storage
  setTokenState(data.token);                // Update React state
  setUserState(data);                       // Update React state
  setStorageMode(mode);                     // Update React state
},
```
→ The login function. When called after a successful login:
1. Saves the token and user to the browser storage (localStorage or sessionStorage)
2. Updates all three React state variables so the rest of the app re-renders with the new auth state

---

```tsx
Lines 43–48:
clearSession: () => {
  clearAuthStorage();         // Remove token from browser storage
  setTokenState(null);        // Clear React state
  setUserState(null);         // Clear React state
  setStorageMode('localStorage'); // Reset storage mode
}
```
→ The logout function. Clears everything.

---

```tsx
Line 51: return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
```
→ Renders the Context Provider. This "publishes" the `value` object to all child components.
Any component nested inside `<AuthProvider>` can read `value` using `useContext(AuthContext)`.

---

```tsx
Lines 54–60:
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return ctx;
}
```
→ A custom hook that reads the auth context.

Other components call `useAuthContext()` instead of `useContext(AuthContext)` directly.
The check `if (!ctx)` throws a helpful error if someone accidentally uses the hook outside the `<AuthProvider>` tree.

---

### 3. React Concepts

#### 🔹 What is State?

**State** is a variable whose value React tracks. When it changes, React automatically re-renders the affected components.

```tsx
const [count, setCount] = useState(0);

// Clicking the button updates count and re-renders the component:
<button onClick={() => setCount(count + 1)}>Count: {count}</button>
```

Without state, the UI would never update when data changes.

---

#### 🔹 What is React Context?

Normally, data flows from parent to child via **props**:

```
App → passes `user` prop → Layout → passes `user` prop → Header → shows username
```

If the chain is long, you have to pass props through many components that don't need them ("prop drilling").

**Context** solves this. You "provide" a value at a high level, and any component — no matter how deep — can "consume" it directly:

```tsx
// Provide once at the top:
<AuthContext.Provider value={authState}>
  <App />        ← doesn't need to pass user
    <Layout />   ← doesn't need to pass user
      <Header /> ← reads user DIRECTLY from context!
</AuthContext.Provider>
```

```tsx
// Any component reads it without props:
function Header() {
  const { user } = useAuthContext(); // ← no prop needed!
  return <span>{user?.username}</span>;
}
```

---

#### 🔹 `useState` vs `useMemo`

| Hook | Purpose |
|------|---------|
| `useState` | Stores a reactive value. When it changes, the component re-renders. |
| `useMemo` | Caches a computed value. Only recomputes when its dependencies change. |

In `authContext.tsx`, `useState` stores the raw token/user data. `useMemo` builds the full context object from those values — this avoids creating a new object on every render (which would cause every context consumer to unnecessarily re-render).

---

### 4. Summary

`authContext.tsx` creates a React Context that stores the logged-in user's token, user info, and helper functions (`setSession`, `clearSession`). It:

1. Reads the initial token/user from browser storage so the login persists across page refreshes.
2. Provides `isAuthenticated` — a simple boolean that guards are used to protect routes.
3. Exposes `setSession` (called after login) and `clearSession` (called after logout).
4. Exports `useAuthContext()` — a custom hook that any component uses to access the auth state.

The `AuthProvider` wraps the entire app (via `AppProviders`), making auth info globally accessible.
