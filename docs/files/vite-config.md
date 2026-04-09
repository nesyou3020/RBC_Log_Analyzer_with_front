# `vite.config.ts` — Documentation

> **File location:** `frontend/vite.config.ts`

---

## 1. File Role

### What is this file?

`vite.config.ts` is the **configuration file for Vite** — the tool that runs and
builds the frontend application.

Vite does two things:
1. **Development server** (`npm run dev`) — Serves your app locally during development.
   It updates the browser instantly when you save a file, without a full page reload.
2. **Production build** (`npm run build`) — Bundles all your TypeScript/React files
   into optimised JavaScript/CSS files that can be deployed to a web server.

`vite.config.ts` is where you customise how Vite does both of these things.

### Why is it important?

Without Vite, the browser could not understand TypeScript or JSX. Vite converts your
`.tsx` files into plain JavaScript that browsers can run. It also handles things like:
- Importing CSS files in JavaScript.
- Processing images and static assets.
- Optimising the final bundle for fast loading.

---

## 2. Code Explanation (Line by Line)

```ts
Line 1: import { defineConfig } from 'vite';
```
→ Imports the `defineConfig` helper function from Vite.

`defineConfig` is a wrapper function that does two things:
1. Provides **TypeScript type checking and autocomplete** for the config options.
2. Returns the configuration object unchanged.

Without `defineConfig`, you could just export a plain object, but you would lose
TypeScript's helpful autocomplete and error checking.

---

```ts
Line 2: import react from '@vitejs/plugin-react';
```
→ Imports the **official Vite plugin for React**.

This plugin adds React-specific support to Vite:
- **JSX transformation** — converts `<div>Hello</div>` into `React.createElement(...)` calls.
- **Fast Refresh** — when you edit a React component, the browser updates only that
  component without a full page reload, keeping your app's state intact (form values,
  scroll position, etc.).

Without this plugin, Vite would not understand `.tsx` files or JSX syntax.

---

```ts
Line 3: (empty line)
```
→ An empty line for readability — separates imports from the main export.

---

```ts
Lines 4–9:
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
});
```
→ Exports the Vite configuration as the **default export** of this module.

`defineConfig({ ... })` receives an object with all the configuration options.
Let's break down each part:

---

```ts
Line 5: plugins: [react()],
```
→ The **plugins** array tells Vite which plugins to use.

`react()` calls the `@vitejs/plugin-react` plugin function you imported on line 2.
Calling it as a function (`react()`) initialises it and returns the plugin object
that Vite expects.

You can add other plugins here too — for example, plugins for SVG files, for
automatic import of CSS modules, or for bundle analysis.

---

```ts
Lines 6–8:
server: {
  port: 5173
}
```
→ Configuration for the **development server** (used by `npm run dev`).

`port: 5173` → Sets the local port number to `5173`.
This means the app is available at `http://localhost:5173` in your browser.

`5173` is Vite's default port. You can change it to any number you want (e.g. `3000`),
as long as the port is not already in use.

---

## 3. Concepts

### 🔹 What is Vite?

Vite (French for "fast") is a modern build tool created by the same person who created Vue.js.
It replaced older tools like Webpack and Create React App for many projects because it is
significantly faster.

**Why is Vite faster?**

Older tools (Webpack) **bundle** all your files together before serving them to the browser.
Even a small change requires re-bundling everything.

Vite uses a different approach:
- During **development**, it serves files individually using the browser's native ES Module support.
  The browser requests exactly the file it needs, and Vite transforms and serves it on demand.
  Only changed files are re-processed.
- During **production build**, it uses Rollup (a fast bundler) to create an optimised bundle.

The result: the development server starts in milliseconds, and file changes are reflected
in the browser almost instantly.

---

### 🔹 Vite Plugins

Vite's core handles JavaScript files. Plugins add support for additional file types and
frameworks.

| Plugin | Adds support for |
|--------|-----------------|
| `@vitejs/plugin-react` | React, JSX, Fast Refresh |
| `@vitejs/plugin-vue` | Vue.js (not used here) |
| `vite-plugin-svgr` | Importing SVG files as React components |

In this project, only the React plugin is needed.

---

### 🔹 Fast Refresh

Fast Refresh is a development feature (provided by `@vitejs/plugin-react`) that updates
React components in the browser **without a full page reload**.

**Without Fast Refresh:**
1. You edit a component.
2. The browser refreshes the entire page.
3. All your app state (form input, which modal is open, etc.) is reset.

**With Fast Refresh:**
1. You edit a component.
2. Only that component is updated in the browser.
3. Your app's state is preserved.

This makes the development experience much smoother.

---

### 🔹 Development vs Production Mode

| | `npm run dev` (development) | `npm run build` (production) |
|--|--|--|
| **Source maps** | Yes — you can debug original source code | Optional — often disabled for smaller files |
| **Code minification** | No — code stays readable | Yes — removes spaces, shortens names |
| **File watching** | Yes — re-processes changed files | No — one-time build |
| **Output** | Served in memory, no files written | Files written to `dist/` folder |
| **Speed** | Near-instant starts | Takes a few seconds |

---

### 🔹 Port Number

A **port** is a numbered "door" on your computer that network connections enter through.
Different applications use different port numbers to avoid conflicts.

- Port `80` → Standard HTTP (web browsers use this for regular websites)
- Port `443` → HTTPS (secure websites)
- Port `5173` → Vite development server (this project)
- Port `8000` → Django backend (the backend server)

When you open `http://localhost:5173`, your browser connects to port `5173` on your
own machine (`localhost`), where Vite is listening and serving your app.

---

### 🔹 `export default`

`export default` means: "This is the main thing this file exports."

When Vite starts, it looks for `vite.config.ts` and reads its default export.
It expects to find a configuration object (created by `defineConfig`).

Other files in the project use **named exports** (`export function foo() {}`),
but config files conventionally use **default exports** because there is only one config per file.

---

## 4. Summary

`vite.config.ts` is a short but important file that configures Vite, the build tool.
In this project, it only needs three things:

1. **React plugin** (`plugins: [react()]`) — Adds JSX support, TypeScript transformation,
   and Fast Refresh to Vite.
2. **Development port** (`server.port: 5173`) — Sets the local URL to `http://localhost:5173`.

That's it. This minimal config is enough to run a full React + TypeScript application.
You would extend this file if you needed to:
- Add path aliases (e.g. `@/components` instead of `../../components`).
- Configure a proxy to the backend API (to avoid CORS issues during development).
- Add more plugins (SVG support, bundle analysis, etc.).
- Change the `dist/` output folder path.
