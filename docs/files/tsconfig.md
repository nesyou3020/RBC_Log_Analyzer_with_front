# `tsconfig.json` — Documentation

> **File location:** `frontend/tsconfig.json`

---

## 1. File Role

### What is this file?

`tsconfig.json` is the **configuration file for TypeScript**.

TypeScript is a version of JavaScript that adds **types**. For example, instead of writing:
```js
function add(a, b) { return a + b; }
```
You write:
```ts
function add(a: number, b: number): number { return a + b; }
```

TypeScript checks your code for mistakes **before it runs** — catching bugs like accidentally
passing a string where a number is expected.

`tsconfig.json` tells the TypeScript compiler:
- Which version of JavaScript to target.
- Which files to check.
- How strict to be when checking for errors.

### Why is it important?

Without this file, TypeScript doesn't know how to compile your code or how strictly to
check it. Every TypeScript project must have a `tsconfig.json`.

---

## 2. Code Explanation (Line by Line)

```json
Line 1: {
```
→ Opens the root JSON object.

---

```json
Line 2: "compilerOptions": {
```
→ Opens the `compilerOptions` section — this is where all TypeScript settings live.
The TypeScript compiler (`tsc`) reads these options to know what to do.

---

```json
Line 3: "target": "ES2020",
```
→ **Output JavaScript version**.

TypeScript compiles your code down to plain JavaScript. This setting says:
*"Output JavaScript that is compatible with the ES2020 standard."*

ES2020 is modern enough to support features like:
- Optional chaining (`obj?.property`)
- Nullish coalescing (`value ?? fallback`)
- Dynamic `import()`

Older targets (like ES5) would convert these into longer, less readable code.
Since all modern browsers support ES2020, there is no need to go older.

---

```json
Line 4: "useDefineForClassFields": true,
```
→ Controls how **class fields** (properties on a class) are defined in the output.

When `true`, TypeScript uses the modern ECMAScript standard behaviour (`Object.defineProperty`
instead of simple assignment). This matters for compatibility with how browsers natively
handle class fields in ES2022+.

For React projects this is typically set to `true` to avoid subtle bugs.

---

```json
Line 5: "lib": ["ES2020", "DOM", "DOM.Iterable"],
```
→ Tells TypeScript which **built-in type definitions** to include.

- `"ES2020"` → Types for JavaScript built-in features (Array, Promise, Map, Set, etc.)
- `"DOM"` → Types for browser APIs (`document`, `window`, `HTMLElement`, `fetch`, etc.)
- `"DOM.Iterable"` → Types for iterating over DOM collections (e.g. `NodeList` with `for...of`)

Without `"DOM"`, TypeScript would not know what `document.getElementById` is and would
show an error, even though that function exists in every browser.

---

```json
Line 6: "module": "ESNext",
```
→ The **module system** format to use for `import`/`export` statements.

`"ESNext"` means "use the latest ES Module format". This tells TypeScript to keep
`import` and `export` statements as-is (not convert them to `require()`).

Vite uses ES Modules natively, so this setting is required.

---

```json
Line 7: "skipLibCheck": true,
```
→ Tells TypeScript to **skip type-checking inside library files** (files in `node_modules`).

Checking every library file would be very slow and might show errors in third-party code
you cannot control. Since library maintainers are responsible for their own types,
skipping them is safe and speeds up compilation significantly.

---

```json
Line 8: "moduleResolution": "Bundler",
```
→ Tells TypeScript how to **find imported files**.

`"Bundler"` mode is designed for tools like Vite and Webpack. It allows:
- Importing without file extensions: `import { foo } from './foo'` (not `'./foo.ts'`)
- Importing from `node_modules` using the `exports` field in `package.json`

Other options (`"Node"`, `"NodeNext"`) are designed for Node.js without a bundler.

---

```json
Line 9: "allowImportingTsExtensions": false,
```
→ Controls whether you can write `import './foo.ts'` (with the `.ts` extension).

`false` means you should write `import './foo'` (without extension).
This is the standard style for bundler-based projects — the bundler resolves the extension.

---

```json
Line 10: "resolveJsonModule": true,
```
→ Allows importing `.json` files directly in TypeScript:

```ts
import config from './config.json';
console.log(config.apiUrl); // TypeScript knows the shape of config.json
```

Without this, TypeScript would refuse to import JSON files.

---

```json
Line 11: "isolatedModules": true,
```
→ Enforces that every file can be **compiled independently**, without knowledge of other files.

Vite compiles each file separately (using esbuild) rather than doing a full project build.
This setting ensures your code is compatible with that approach.

In practice, it means you cannot use certain TypeScript-only features (like `const enum`)
that require cross-file knowledge to compile.

---

```json
Line 12: "noEmit": true,
```
→ Tells the TypeScript compiler to **check for errors but not produce any output files**.

Normally `tsc` would generate `.js` files from your `.ts` files. But in this project,
**Vite handles the compilation** — TypeScript is only used for type-checking.

With `noEmit: true`:
- `tsc` → "Check types but don't create any `.js` files."
- Vite → "Convert `.tsx`/`.ts` files to JavaScript for the browser."

This avoids duplicate output and keeps Vite in control of the build output.

---

```json
Line 13: "jsx": "react-jsx",
```
→ Tells TypeScript how to handle **JSX** (the HTML-like syntax in React components).

```tsx
// JSX code you write:
const element = <div className="box">Hello</div>;

// What TypeScript transforms it to with "react-jsx":
import { jsx as _jsx } from 'react/jsx-runtime';
const element = _jsx("div", { className: "box", children: "Hello" });
```

`"react-jsx"` uses the modern React 17+ JSX transform, which means you no longer need
to write `import React from 'react'` at the top of every file.

---

```json
Line 14: "strict": true,
```
→ Enables **all strict type-checking rules** at once. This is the single most important
strictness setting. It turns on several rules including:

- **`strictNullChecks`** — TypeScript complains if you might be using a value that could be `null` or `undefined` without checking first.
- **`noImplicitAny`** — Variables must have a type. TypeScript won't silently assume `any`.
- **`strictFunctionTypes`** — Function parameter types must match exactly.

Example without `strict`:
```ts
function greet(name: string) { return name.toUpperCase(); }
greet(null); // No error! But crashes at runtime.
```

With `strict`:
```ts
greet(null); // ❌ Error: Argument of type 'null' is not assignable to parameter of type 'string'
```

---

```json
Line 15: "noUnusedLocals": true,
```
→ Reports an error if you declare a **local variable but never use it**.

```ts
function calculate() {
  const unused = 42; // ❌ Error: 'unused' is declared but its value is never read
  return 100;
}
```

This keeps the code clean and avoids accidentally forgetting to use something you declared.

---

```json
Line 16: "noUnusedParameters": true,
```
→ Reports an error if a **function parameter** is declared but never used inside the function.

```ts
function greet(name: string, age: number) {
  return `Hello, ${name}`; // ❌ Error: 'age' is declared but its value is never read
}
```

This helps prevent bugs where you intend to use a parameter but forget.
If a parameter is intentionally unused, you can prefix it with `_`:
```ts
function greet(_name: string, age: number) { return age; } // ✅ OK
```

---

```json
Line 17: "noFallthroughCasesInSwitch": true,
```
→ Reports an error if a `switch` statement has a `case` that falls through to the next
case without a `break` or `return`.

```ts
switch (status) {
  case 'loading':
    doSomething();
    // ❌ Error: Fallthrough case in switch — missing 'break' or 'return'
  case 'done':
    doSomethingElse();
    break;
}
```

Fallthrough is almost always a bug (a forgotten `break`), so this setting catches it.

---

```json
Line 18: },
```
→ Closes the `compilerOptions` section.

---

```json
Line 19: "include": ["src"]
```
→ Tells TypeScript **which folders to check**.

`["src"]` means: "Only type-check files inside the `src/` directory."
Files outside `src/` (like `vite.config.ts`) are not checked by this config.

> `vite.config.ts` is typically handled by a separate config or by Vite itself.

---

```json
Line 20: }
```
→ Closes the root JSON object.

---

## 3. Concepts

### 🔹 What is TypeScript?

TypeScript is JavaScript with **type annotations**. A type annotation tells TypeScript
what kind of value a variable holds.

```ts
let username: string = "alice";    // Must be a string
let age: number = 30;              // Must be a number
let isAdmin: boolean = false;      // Must be true or false
```

If you try to put the wrong type in:
```ts
age = "thirty"; // ❌ TypeScript error: Type 'string' is not assignable to type 'number'
```

TypeScript catches this **before the code runs**, preventing a class of runtime bugs entirely.

---

### 🔹 `strict: true` — Why Enable It?

`strict: true` makes TypeScript stricter, which means more errors early — and fewer
bugs in production. It is considered best practice for new projects.

The most impactful rule it enables is `strictNullChecks`:

```ts
function getUser(id: string): User | null {
  return db.find(id) ?? null;
}

const user = getUser("123");
console.log(user.name); // ❌ Error: 'user' is possibly 'null'

// Fix: check first
if (user) {
  console.log(user.name); // ✅ OK
}
```

---

### 🔹 `noEmit: true` — TypeScript as a Linter

With `noEmit: true`, TypeScript only **checks** your code; it does not produce output.
This is the right setup when a bundler (Vite) handles the actual compilation.

The workflow is:
1. **TypeScript** → Checks types, reports errors (but creates no files).
2. **Vite** → Converts TypeScript to JavaScript, bundles everything, creates output files.

---

### 🔹 `lib` — Built-in Type Libraries

`lib` tells TypeScript what APIs exist in the environment where the code runs.

- Without `"DOM"` → TypeScript would not know what `window`, `document`, or `fetch` are.
- Without `"ES2020"` → TypeScript would not know about `Promise.allSettled` or `BigInt`.

These are not actual JavaScript files — they are just TypeScript **type definitions**
that describe what the browser and JavaScript engine provide.

---

## 4. Summary

`tsconfig.json` configures the TypeScript compiler for this project. It:

1. **Targets ES2020** — outputs modern JavaScript.
2. **Enables DOM types** — so TypeScript knows about browser APIs.
3. **Uses ESNext modules** — compatible with Vite's module system.
4. **Disables output** (`noEmit`) — Vite handles compilation; TypeScript only checks.
5. **Sets JSX mode** to `react-jsx` — enables the modern React transform.
6. **Enables strict mode** — catches null errors, unused variables, and more.
7. **Only checks the `src/` folder** — excludes config files and `node_modules`.

In short, this config makes TypeScript a powerful code quality checker that helps you
write safer, more reliable React code.
