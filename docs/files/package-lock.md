# `package-lock.json` — Documentation

> **File location:** `frontend/package-lock.json`

---

## 1. File Role

### What is this file?

`package-lock.json` is the **exact shopping receipt** for every library installed in the project.

While `package.json` says *"I need React version 18 or newer"*, `package-lock.json` records
*"I installed React version 18.3.1 exactly, downloaded from this specific URL, with this
security checksum"*.

> ⚠️ **You should never edit this file manually.** It is automatically generated and
> updated by npm every time you run `npm install`.

### Why is it important?

`package.json` intentionally uses flexible version ranges (e.g. `^18.3.1` means
"18.3.1 or any compatible newer version"). This means two developers who run
`npm install` on different days might get different versions if a new release came out.

`package-lock.json` solves this by **locking every dependency to an exact version**.
This guarantees that:
- Every developer on the team gets the exact same versions.
- The CI/CD build server gets the exact same versions.
- The app behaves identically in every environment.

---

## 2. Code Explanation (Key Lines)

The file is very long (hundreds of entries), but its structure is repetitive.
Here are the key parts explained:

---

```json
Line 1: {
```
→ Opens the root JSON object.

---

```json
Line 2: "name": "rbc-log-analyzer-frontend",
```
→ The project name, copied from `package.json`.

---

```json
Line 3: "version": "0.1.0",
```
→ The project version, copied from `package.json`.

---

```json
Line 4: "lockfileVersion": 3,
```
→ The **format version** of `package-lock.json` itself.
npm has evolved its lock file format over time:
- Version 1 → npm 5/6
- Version 2 → npm 7/8 (added `packages` section)
- Version 3 → npm 9+ (current, only uses `packages` section)

If you share the project with someone who has an older npm, they may see a warning.

---

```json
Line 5: "requires": true,
```
→ An internal flag that tells npm older tools to use the `requires` field
in each package entry when resolving dependencies. It is automatically set and
you do not need to worry about it.

---

```json
Lines 6–20 (the `""` entry):
"packages": {
  "": {
    "name": "rbc-log-analyzer-frontend",
    "version": "0.1.0",
    "dependencies": { ... },
    "devDependencies": { ... }
  },
  ...
}
```
→ The `"packages"` section is the core of lock file version 3.
It contains one entry for **every single package** installed — including packages
that your direct dependencies depend on (called **transitive dependencies**).

The `""` (empty string) key represents **your own project** — it mirrors the content
of `package.json`.

Every other key is a package path like `"node_modules/@babel/core"`.

---

### Example of one package entry

```json
"node_modules/@babel/core": {
  "version": "7.29.0",
  "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.29.0.tgz",
  "integrity": "sha512-CGOfOJ...",
  "dev": true,
  "license": "MIT",
  "dependencies": {
    "@babel/code-frame": "^7.29.0",
    ...
  },
  "engines": {
    "node": ">=6.9.0"
  }
}
```

| Field | Meaning |
|-------|---------|
| `"version"` | The **exact** version installed (`7.29.0`, not `^7.29.0`). |
| `"resolved"` | The exact URL where npm downloaded this package from. |
| `"integrity"` | A cryptographic **hash** (fingerprint) of the downloaded file. If the file is tampered with, this hash won't match and npm will refuse to install it. |
| `"dev"` | `true` = this package is only used for development (devDependency). |
| `"license"` | The open-source license of the package (MIT = very permissive, free to use). |
| `"dependencies"` | The packages that **this** package itself depends on (transitive dependencies). |
| `"engines"` | The minimum Node.js version required to run this package. |

---

## 3. Concepts

### 🔹 Direct vs Transitive Dependencies

When you install `react-router-dom`, npm also installs every library that
`react-router-dom` itself needs. Those are called **transitive dependencies**.

Your `package.json` lists maybe 10 libraries. But `package-lock.json` may list
hundreds — because each of those 10 libraries depends on other libraries, which
depend on other libraries, and so on.

```
Your project
 └── react-router-dom (direct dependency)
      └── @remix-run/router (transitive dependency)
      └── react (peer dependency, already installed)
```

All of these exact versions are recorded in `package-lock.json`.

---

### 🔹 Integrity Hash

The `"integrity"` field contains a **sha512** hash — a long string of characters
that uniquely identifies the exact content of a file.

If even one byte of the downloaded package differs from what was recorded, the hash
won't match, and npm will refuse to install it. This protects against:
- Corrupted downloads.
- Malicious changes to packages on the npm registry.

Example:
```
"integrity": "sha512-CGOfOJqWjg2qW/Mb6..."
```

You can think of it like a fingerprint — no two different files will ever produce the same hash.

---

### 🔹 `npm install` vs `npm ci`

| Command | Reads | Behaviour |
|---------|-------|-----------|
| `npm install` | `package.json` + `package-lock.json` | Installs dependencies, may update `package-lock.json` if versions changed. |
| `npm ci` | `package-lock.json` only | Installs **exactly** what is in the lock file. Fails if `package-lock.json` is out of date. Used in CI/CD pipelines for reproducible builds. |

---

### 🔹 Should I commit `package-lock.json`?

**Yes, always commit it to Git.**

Committing it ensures every team member and every server gets exactly the same versions.
If you don't commit it, different environments may install slightly different versions,
leading to bugs that only appear "on my machine".

---

## 4. Summary

`package-lock.json` is automatically generated by npm and should never be edited manually. It:

1. Records the **exact version** of every package installed (direct and transitive).
2. Records the **download URL** for each package.
3. Records a **security hash** for each package to detect tampering.
4. Guarantees that running `npm install` on any machine gives **identical results**.
5. Should always be committed to Git alongside `package.json`.

Think of `package.json` as the shopping list ("I need milk") and `package-lock.json` as
the receipt ("I bought Brandname Whole Milk 1L, from Store X, batch 2024-03-15, price €1.20").
