# `src/components/` — Documentation

> **Folder location:** `frontend/src/components/`

This folder contains **small, reusable UI pieces** that are used on multiple pages.
Instead of repeating the same code everywhere, you define it once here and import it wherever you need it.

Files in this folder:
- `EmptyState.tsx`
- `ErrorAlert.tsx`
- `Loading.tsx`

---

## `EmptyState.tsx`

### 1. File Role

`EmptyState` is a component that shows a **grey message when a list is empty**.

For example, if you load the Imports page and there are no files yet, instead of showing
a blank table, the app shows a friendly message like "No imports found."

---

### 2. Code Explanation (Line by Line)

```tsx
Line 1: export function EmptyState({ label }: { label: string }) {
```
→ Defines and exports a React component called `EmptyState`.

It accepts one **prop** (input) called `label`, which must be a `string`.
The `{ label }: { label: string }` syntax is TypeScript's way of writing:
"This function takes an object with a property called `label` that is a string."

---

```tsx
Line 2:   return <p className="muted">{label}</p>;
```
→ Renders a `<p>` (paragraph) HTML element with the CSS class `"muted"` (which makes the text grey and small, defined in `global.css`).
The `{label}` inside the JSX outputs the text that was passed in as a prop.

---

```tsx
Line 3: }
```
→ Closes the function.

---

### 3. React Concepts

#### 🔹 What is a Component?

A React **component** is just a function that returns JSX (the HTML-like syntax).

```tsx
// This is a component:
function Greeting() {
  return <h1>Hello!</h1>;
}

// You use it like an HTML tag:
<Greeting />
```

Components let you split your UI into reusable pieces. Instead of copying the same HTML everywhere, you write it once as a component and use it wherever needed.

---

#### 🔹 What are Props?

**Props** (short for "properties") are inputs you pass to a component, like arguments to a function.

```tsx
// Component definition:
function EmptyState({ label }: { label: string }) {
  return <p>{label}</p>;
}

// Using it with different labels:
<EmptyState label="No files found." />
<EmptyState label="No users yet." />
<EmptyState label="No events to display." />
```

Each usage shows a different message because the `label` prop is different.

---

### 4. Summary

`EmptyState` is a tiny, reusable component with one job: display a muted message when there is nothing to show. It accepts a `label` prop and renders it as a paragraph.

---

---

## `ErrorAlert.tsx`

### 1. File Role

`ErrorAlert` shows a **red error message** when something goes wrong, such as a network request failing.

---

### 2. Code Explanation (Line by Line)

```tsx
Line 1: export function ErrorAlert({ message }: { message: string }) {
```
→ Defines and exports a component called `ErrorAlert`.
It accepts one prop: `message` (a string containing the error text to display).

---

```tsx
Line 2:   return <p className="error">{message}</p>;
```
→ Renders a paragraph with the CSS class `"error"` (which makes the text red, defined in `global.css`).
`{message}` outputs the error text passed in via the prop.

---

```tsx
Line 3: }
```
→ Closes the function.

---

### 3. React Concepts

#### 🔹 CSS Classes in JSX

In regular HTML you write `class="error"`. In JSX (React) you write `className="error"`.

The name changed because `class` is a reserved keyword in JavaScript (used for defining classes),
so React uses `className` instead to avoid confusion.

```tsx
// HTML:       <p class="error">Something went wrong</p>
// JSX/React:  <p className="error">Something went wrong</p>
```

---

#### 🔹 Conditional Rendering

In pages, `ErrorAlert` is often only shown when there is actually an error:

```tsx
{list.error ? <ErrorAlert message={(list.error as Error).message} /> : null}
```

This reads: "If `list.error` is truthy, show `<ErrorAlert>`, otherwise show nothing (`null`)."
This is called **conditional rendering** — displaying something only when a condition is true.

---

### 4. Summary

`ErrorAlert` is a tiny component that renders a red error message. It takes a `message` prop and displays it in a styled paragraph. Used across pages to show API errors in a consistent way.

---

---

## `Loading.tsx`

### 1. File Role

`Loading` shows a **grey loading message** while data is being fetched from the backend.

It gives the user visual feedback that the app is working, rather than showing a blank space.

---

### 2. Code Explanation (Line by Line)

```tsx
Line 1: export function Loading({ label = 'Loading...' }: { label?: string }) {
```
→ Defines and exports a component called `Loading`.

It accepts one optional prop: `label`.
- The `?` after `label` in `label?: string` means the prop is **optional** — you don't have to pass it.
- `= 'Loading...'` is the **default value** — if you don't pass `label`, it defaults to the text `"Loading..."`.

---

```tsx
Line 2:   return <p className="muted">{label}</p>;
```
→ Renders a paragraph with the CSS class `"muted"` (grey text) and shows the label text.

---

```tsx
Line 3: }
```
→ Closes the function.

---

### 3. React Concepts

#### 🔹 Optional Props with Default Values

Props can be optional. You mark them optional with `?` and give a default value with `=`:

```tsx
function Loading({ label = 'Loading...' }: { label?: string }) {
  return <p>{label}</p>;
}

// Without label → shows "Loading..."
<Loading />

// With custom label → shows "Fetching data..."
<Loading label="Fetching data..." />
```

This makes components flexible without requiring the caller to always provide every value.

---

#### 🔹 Typical Usage Pattern

In a page that fetches data, you often see this pattern:

```tsx
// Show loading while data is being fetched:
{list.isLoading ? <Loading /> : null}

// Show error if something went wrong:
{list.error ? <ErrorAlert message={...} /> : null}

// Show empty state if no items:
{list.data?.length === 0 ? <EmptyState label="No items." /> : null}

// Show data if everything is fine:
{list.data?.map(item => <div key={item.id}>{item.name}</div>)}
```

The three small components (`Loading`, `ErrorAlert`, `EmptyState`) cover the three "not ready" states of any data fetch.

---

### 4. Summary

`Loading` is a tiny component that shows a muted "Loading..." message (or a custom message via the `label` prop) while data is being fetched. The `label` prop is optional and defaults to `"Loading..."`.

---

---

## Folder Summary

The `components/` folder contains three tiny but frequently used UI components:

| Component | Shows when... | CSS class |
|-----------|--------------|-----------|
| `Loading` | Data is being fetched | `muted` (grey) |
| `ErrorAlert` | A request failed | `error` (red) |
| `EmptyState` | A list has no items | `muted` (grey) |

All three follow the same simple pattern:
1. Accept a text prop (optional for `Loading`, required for the others)
2. Render a styled paragraph

They keep the code **DRY** (Don't Repeat Yourself) — instead of writing the same paragraph in every page, you import the component and use it with one line.
