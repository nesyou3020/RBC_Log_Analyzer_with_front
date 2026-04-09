# `package.json` — Documentation

> **File location:** `frontend/package.json`

---

## 1. File Role

### What is this file?

`package.json` is the **project's identity card and instruction manual** for Node.js.

It does two essential things:
1. **Describes** the project (name, version, type).
2. **Lists all libraries** (packages) the project depends on, and the **commands** to run it.

When another developer clones this project and runs `npm install`, Node.js reads this file
and downloads all the listed libraries automatically.

### Why is it important?

Without `package.json`, you would have to manually download every library and figure out
which version to use. It makes the project portable — anyone can set it up with one command.

---

## 2. Code Explanation (Line by Line)

```json
Line 1: {
```
→ Opens the JSON object. The entire file is one big JSON object (a collection of key-value pairs).

---

```json
Line 2: "name": "rbc-log-analyzer-frontend",
```
→ The **name** of the project as registered with Node.js.
Must be lowercase with no spaces (hyphens are allowed).
This name appears when the package is published to npm (a public library registry), but
since this project is private it's only used internally.

---

```json
Line 3: "version": "0.1.0",
```
→ The current **version** of this project.
Follows **Semantic Versioning** (SemVer): `MAJOR.MINOR.PATCH`

- `0` → Major version (0 = still in early development, not stable yet)
- `1` → Minor version (1 new feature added since the initial release)
- `0` → Patch version (0 bug fixes on top of this minor version)

---

```json
Line 4: "private": true,
```
→ Prevents this package from being accidentally **published to npm** (the public library registry).
Since this is a company/personal project and not a public library, this is set to `true` for safety.

---

```json
Line 5: "type": "module",
```
→ Tells Node.js that all `.js` files in this project use **ES Module** syntax (`import`/`export`)
instead of the older CommonJS syntax (`require`/`module.exports`).
This is required because Vite uses modern ES Modules.

---

```json
Lines 6–10:
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview"
},
```
→ Defines **runnable commands** (shortcuts for long terminal commands).
You run them with `npm run <name>`.

| Command | What you type | What it does |
|---------|--------------|--------------|
| `dev` | `npm run dev` | Starts the development server. Opens the app at `http://localhost:5173`. Changes to code are reflected instantly without reloading. |
| `build` | `npm run build` | Compiles TypeScript (`tsc -b`) then bundles everything into optimised files in the `dist/` folder, ready to be hosted on a real server. |
| `preview` | `npm run preview` | Serves the already-built `dist/` folder locally so you can test the production build before deploying. |

---

```json
Lines 11–18:
"dependencies": {
  "@tanstack/react-query": "^5.76.2",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-is": "^19.2.4",
  "react-router-dom": "^6.30.1",
  "recharts": "^3.8.1"
},
```
→ **Runtime dependencies** — libraries that must be included in the final app that runs in the user's browser.

| Package | Purpose |
|---------|---------|
| `@tanstack/react-query` | Manages data fetching from the backend — handles caching, loading states, error states, and re-fetching automatically. |
| `react` | The core React library — provides the tools to build UI components. |
| `react-dom` | Connects React to the browser's DOM (the actual HTML). Needed to render React on a web page. |
| `react-is` | A utility package React uses internally to check if something is a valid React element. |
| `react-router-dom` | Handles navigation — shows different pages depending on the URL without reloading the browser. |
| `recharts` | A chart library. Used to draw the train speed graph on the Events page. |

---

```json
Lines 19–25:
"devDependencies": {
  "@types/react": "^18.3.21",
  "@types/react-dom": "^18.3.7",
  "@vitejs/plugin-react": "^4.4.1",
  "typescript": "^5.8.3",
  "vite": "^8.0.5"
}
```
→ **Development-only dependencies** — tools used only during development and building.
They are **not included** in the final production bundle that users download.

| Package | Purpose |
|---------|---------|
| `@types/react` | TypeScript type definitions for React. Lets TypeScript understand React's API and catch mistakes. |
| `@types/react-dom` | TypeScript type definitions for `react-dom`. |
| `@vitejs/plugin-react` | Vite plugin that adds React support (JSX transformation, Fast Refresh for instant updates during dev). |
| `typescript` | The TypeScript compiler. Checks your code for type errors before it runs. |
| `vite` | The build tool and development server. Extremely fast at serving and bundling the project. |

---

```json
Line 26: }
```
→ Closes the JSON object.

---

## 3. Concepts

### 🔹 Dependencies vs devDependencies

| | `dependencies` | `devDependencies` |
|--|--|--|
| **When used** | At runtime (in the browser) | Only during development / build |
| **Included in production build?** | ✅ Yes | ❌ No |
| **Examples** | React, React Query, Recharts | TypeScript, Vite, type definitions |

Think of it this way:
- `dependencies` = ingredients you need in the final meal.
- `devDependencies` = kitchen tools you need to prepare the meal but don't serve to the customer.

---

### 🔹 Version Numbers (`^5.76.2`)

Version numbers use Semantic Versioning: `MAJOR.MINOR.PATCH`

The `^` (caret) prefix means **"compatible with this version"**:
- `^5.76.2` → Install version `5.76.2` or any newer version that starts with `5.x.x`
- Major version (`5`) is fixed — `npm install` will NOT install version `6.x.x`, which might have breaking changes.

Example:
- `^5.76.2` → Can install `5.77.0`, `5.80.1`, but NOT `6.0.0`

---

### 🔹 npm Scripts

Scripts are shortcuts to long commands. Instead of typing:
```
./node_modules/.bin/vite
```
You type:
```
npm run dev
```

npm looks up `"dev"` in the `"scripts"` section and runs the associated command.

---

### 🔹 React and React DOM — Why two packages?

React is split into two packages on purpose:

- **`react`** — The core logic. Works anywhere: web, mobile (React Native), desktop.
- **`react-dom`** — The part that specifically renders to a web browser's DOM.

This separation means the same React code can be reused across platforms (web and mobile)
by swapping `react-dom` for a platform-specific renderer.

---

### 🔹 TanStack React Query

React Query is a data-fetching library. Without it, you would have to write code like:

```tsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetch('/api/imports')
    .then(r => r.json())
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);
```

React Query replaces all of that with:
```tsx
const { data, isLoading, isError } = useQuery({ queryKey: ['imports'], queryFn: getImports });
```

It also automatically caches responses, retries on failure, and keeps data fresh.

---

## 4. Summary

`package.json` is the heart of every Node.js project. It:

1. Names and versions the project (`rbc-log-analyzer-frontend`, `0.1.0`).
2. Marks it as private so it cannot be accidentally published.
3. Declares it as an ES Module project.
4. Defines three handy scripts: `dev` (run locally), `build` (bundle for production), `preview` (test the build).
5. Lists runtime libraries (React, React Query, Recharts, React Router) under `dependencies`.
6. Lists development-only tools (TypeScript, Vite, type definitions) under `devDependencies`.

When you run `npm install`, npm reads this file and downloads every library listed.
