# `index.html` — Documentation

> **File location:** `frontend/index.html`

---

## 1. File Role

### What is this file?

`index.html` is the **one and only HTML page** of the entire application.
When you open the app in a browser, this is literally the first file the browser reads.

Every React application only has **one** HTML file — this is called a **Single-Page Application (SPA)**. Instead of loading a new HTML file for each page you visit, the browser loads this file once, and JavaScript takes care of changing what you see on screen.

### Why is it important?

Without this file, the browser has nothing to show. It is the "skeleton" that React attaches itself to.

---

## 2. Code Explanation (Line by Line)

```html
Line 1: <!doctype html>
```
→ Tells the browser: "This document is written in HTML5 (the modern version of HTML)."
This must always be the very first line of any HTML file. It is not a tag — it is a declaration.

---

```html
Line 2: <html lang="en">
```
→ Opens the `<html>` element — the container for everything on the page.
`lang="en"` tells the browser (and screen readers) that the page is written in **English**.

---

```html
Line 3: <head>
```
→ Opens the `<head>` section. The `<head>` is **invisible** — it contains settings and
metadata that the browser uses, but that the user never sees directly.

---

```html
Line 4: <meta charset="UTF-8" />
```
→ Sets the **character encoding** to UTF-8.
This means the page can display any character from any language — accented letters (é, ü),
symbols, emojis, etc. Without this, special characters might appear as garbage symbols.

---

```html
Line 5: <meta name="viewport" content="width=device-width, initial-scale=1.0" />
```
→ Controls how the page looks on **mobile devices**.

- `width=device-width` → The page width matches the device's screen width (not a zoomed-out desktop view).
- `initial-scale=1.0` → Start at normal zoom (100%).

Without this line, the app would look like a tiny zoomed-out version on phones.

---

```html
Line 6: <title>RBC Log Analyzer</title>
```
→ Sets the **tab title** that appears in the browser tab.
You will see "RBC Log Analyzer" written at the top of your browser tab.

---

```html
Lines 7–10:
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
/>
```
→ Loads the **Font Awesome** icon library from the internet (a CDN).

- `rel="stylesheet"` → This link loads a CSS file (a stylesheet).
- `href="..."` → The URL of the Font Awesome CSS file hosted by cdnjs (a public library server).

Font Awesome provides hundreds of ready-made icons (the small images you see in the sidebar: house icon, folder icon, search icon, etc.).
Loading it from a CDN means we don't need to include the files locally — the browser downloads them directly from the internet.

---

```html
Line 11: </head>
```
→ Closes the `<head>` section.

---

```html
Line 12: <body>
```
→ Opens the `<body>` section. Everything inside `<body>` **is visible** to the user.
In this case, the body is almost empty — React will fill it in dynamically.

---

```html
Line 13: <div id="root"></div>
```
→ This is the **most important line for React**.

It is an empty `<div>` (a box) with the special ID `"root"`.
React finds this element and **injects the entire application** inside it.

In `src/main.tsx`, you will see:
```tsx
document.getElementById('root')
```
That line finds this exact `<div>` and tells React: "Build the app inside here."

---

```html
Line 14: <script type="module" src="/src/main.tsx"></script>
```
→ Loads the **JavaScript entry point** of the application.

- `type="module"` → Tells the browser this is a modern JavaScript module (ES Module), which supports `import`/`export` syntax.
- `src="/src/main.tsx"` → Points to `src/main.tsx`, the first TypeScript/React file that runs.

**Why does the browser accept `.tsx`?**
It doesn't directly — Vite (the build tool) intercepts this request, converts the `.tsx` file into plain JavaScript the browser understands, and serves it on the fly during development.

---

```html
Line 15: </body>
Line 16: </html>
```
→ Close the `<body>` and `<html>` elements. Every HTML tag that is opened must be closed.

---

## 3. Concepts

### 🔹 Single-Page Application (SPA)

Traditional websites load a **new HTML page** every time you click a link.
In an SPA, the browser loads **one HTML file once** and JavaScript updates the content
dynamically without reloading the page. This makes the app feel fast — like a desktop app.

This project is an SPA: `index.html` is the only HTML file; React handles navigation.

---

### 🔹 `<div id="root">` — The Mount Point

React needs somewhere to "attach" itself. The `<div id="root">` is that attachment point.
At startup, React replaces the empty `<div>` with the full rendered app.
You will never see this `<div>` in the browser — React fills it immediately.

---

### 🔹 CDN (Content Delivery Network)

A CDN is a network of servers around the world that host popular files (like Font Awesome).
Instead of serving the file from your own server, you link to it from the CDN.

Benefits:
- Faster load times (the CDN server nearest to the user responds).
- The file may already be cached in the user's browser from another website.
- No need to download or host the library yourself.

---

### 🔹 `type="module"` — ES Modules

Modern JavaScript supports splitting code into multiple files using `import` and `export`.
The `type="module"` attribute tells the browser that this script uses that modern syntax.
Vite relies on this to serve your source files during development without bundling them first.

---

## 4. Summary

`index.html` is a very short but critically important file. It:

1. Declares itself as an HTML5 page.
2. Sets the language, character encoding, and mobile viewport.
3. Names the app "RBC Log Analyzer" in the browser tab.
4. Loads Font Awesome icons from a CDN.
5. Provides the empty `<div id="root">` where React mounts the entire application.
6. Loads `src/main.tsx`, which starts the React application.

You almost never need to edit this file, unless you want to change the page title,
add a new external library via CDN, or change the favicon.
