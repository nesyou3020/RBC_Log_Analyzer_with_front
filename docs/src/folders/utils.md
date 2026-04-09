# `src/utils/` — Documentation

> **Folder location:** `frontend/src/utils/`

This folder contains **pure helper functions** — functions that take an input, compute something, and return an output, with no side effects on the rest of the app.

Files:
- `theme.ts` — Dark/light theme helpers
- `trainGraphUtils.ts` — Transforms raw events into chart-ready data

---

## `theme.ts`

### 1. File Role

`theme.ts` manages the **dark / light colour theme** of the app.

It:
1. Detects the user's OS theme preference (dark or light).
2. Checks if the user previously chose a theme in this app.
3. Applies the theme to the page by setting a `data-theme` attribute on `<html>`.
4. Saves the user's choice to localStorage so it persists across browser sessions.

---

### 2. Code Explanation (Line by Line)

```ts
Line 1: const THEME_STORAGE_KEY = 'rbc_theme_mode';
```
→ The key used to store the chosen theme in `localStorage`. Storing it as a constant avoids typos if used in multiple places.

---

```ts
Line 3: export type ThemeMode = 'light' | 'dark';
```
→ A TypeScript union type — the theme can only ever be `'light'` or `'dark'`.

---

```ts
Lines 5–10:
export function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
```
→ Detects the **operating system's preferred colour scheme**.

- `typeof window === 'undefined'` — Safety check. In server-side rendering (SSR) there is no browser `window`. If `window` doesn't exist, default to `'dark'`.
- `window.matchMedia('(prefers-color-scheme: dark)')` — A browser API that checks if the OS is set to dark mode.
- `.matches` — Returns `true` if the OS is in dark mode.

If the OS is in dark mode → returns `'dark'`. Otherwise → returns `'light'`.

---

```ts
Lines 12–22:
export function getStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (value === 'light' || value === 'dark') {
    return value;
  }
  return null;
}
```
→ Reads the **previously saved theme** from `localStorage`.

- `localStorage.getItem(THEME_STORAGE_KEY)` — Gets the stored string value.
- If the stored value is exactly `'light'` or `'dark'`, return it.
- Otherwise return `null` (no stored preference or invalid value).

---

```ts
Lines 24–26:
export function resolveTheme(): ThemeMode {
  return getStoredTheme() ?? getSystemTheme();
}
```
→ Determines which theme to use:
1. Try the stored user preference first (`getStoredTheme()`).
2. If none is stored (`null`), fall back to the OS preference (`getSystemTheme()`).

Called once on app startup in `main.tsx` and when the layout initialises.

---

```ts
Lines 28–33:
export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.setAttribute('data-theme', theme);
}
```
→ **Applies the theme** to the page.

`document.documentElement` refers to the `<html>` element.
`setAttribute('data-theme', theme)` sets `<html data-theme="dark">` or `<html data-theme="light">`.

In `global.css`, CSS variables are defined differently for each theme:
```css
[data-theme="dark"]  { --color-bg-primary: #0F172A; }
[data-theme="light"] { --color-bg-primary: #FFFFFF; }
```

By changing this one attribute, all colours across the entire app switch instantly.

---

```ts
Lines 35–40:
export function persistTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}
```
→ **Saves the user's theme choice** to localStorage.

Called whenever the user clicks the theme toggle button in `MainLayout`. The next time the user opens the app, `getStoredTheme()` will read this value.

---

### 3. Concepts

#### 🔹 CSS Custom Properties (Variables)

CSS variables (also called custom properties) let you define a value once and reuse it:

```css
:root {
  --color-bg: #0F172A;
  --color-text: #F1F5F9;
}

.card {
  background-color: var(--color-bg);
  color: var(--color-text);
}
```

By redefining the variables for each theme, all elements that use them automatically change:

```css
[data-theme="light"] {
  --color-bg: #FFFFFF;
  --color-text: #1E293B;
}
```

---

#### 🔹 `localStorage` vs `sessionStorage`

| | `localStorage` | `sessionStorage` |
|--|--|--|
| **Persists across tabs?** | Yes | No |
| **Persists after browser close?** | Yes | No |
| **Max size** | ~5MB | ~5MB |
| **Use case** | Long-term preferences (theme, settings) | Temporary session data |

The theme is stored in `localStorage` so it persists even after closing the browser.

---

### 4. Summary

`theme.ts` handles the complete theme lifecycle: **detect → apply → save → restore**.

| Function | Purpose |
|----------|---------|
| `getSystemTheme()` | Reads OS dark/light mode preference |
| `getStoredTheme()` | Reads previously saved choice from localStorage |
| `resolveTheme()` | Picks the right theme (stored > system) |
| `applyTheme(theme)` | Sets `data-theme` on `<html>` to switch all CSS variables |
| `persistTheme(theme)` | Saves the choice to localStorage |

---

---

## `trainGraphUtils.ts`

### 1. File Role

`trainGraphUtils.ts` transforms **raw log event data** from the backend into a clean, chart-ready array of data points for the train speed graph on the Events page.

The raw data from the log file is messy (missing values, different field names, irregular timestamps). This file normalises it into a consistent `TrainGraphDataPoint[]` array that the Recharts library can use directly.

---

### 2. Code Explanation (Key Parts)

```ts
Lines 1–15:
export const M_MODE_DICT: Record<string | number, string> = {
  "0": "FS",   // Full Supervision
  "1": "OS",   // On Sight
  "2": "SR",   // Staff Responsible
  "3": "SH",   // Shunting
  "4": "UN",   // Unfitted
  "5": "SL",   // Sleeping
  "6": "SB",   // Stand By
  "7": "TR",   // Trip
  "8": "PT",   // Post Trip
  "9": "SF",   // Safe
  "10": "IS",  // Isolation
  "12": "LS",  // Limited Supervision
  "13": "SN",  // National System
  "14": "RV",  // Reversing
};
```
→ A lookup table that converts numeric ETCS train mode codes into human-readable abbreviations. The ERTMS/ETCS standard defines these modes; this dictionary makes them readable in the chart tooltip.

---

```ts
Lines 17–24:
export interface TrainGraphDataPoint {
  Time_sec: number;       // Seconds since the first event
  V_Train: number;        // Train speed in km/h (or the raw unit)
  M_Mode_value: number;   // Numeric mode code
  M_Mode_label: string;   // Human-readable mode label (from M_MODE_DICT)
  Timestamp: string;      // Original timestamp string
}
```
→ Defines the shape of a single data point for the speed/mode chart.

---

**`parseTimestampValue(value)`** (lines 26–49)  
→ Converts various timestamp formats into a JavaScript `Date` object.
Log files can have inconsistent timestamp formats (ISO 8601, or custom formats like `"2022-08-25 14:00:14.705 +0000"`). This function tries multiple parsing approaches and normalises them.

---

**`toNumber(value, fallback)`** (lines 51–62)  
→ Safely converts a value to a number. If the value is missing, empty, or not a valid number, it returns the `fallback` value (default `0`). This prevents crashes when log data has missing or malformed speed values.

---

**`hasRequiredGraphFields(event)`** (lines 64–82)  
→ Checks if a raw event has the minimum fields needed for the graph (timestamp, speed, mode). Events that don't have all three are filtered out and not plotted.

---

**`transformRawEventsToChartData(rawEvents)` — The Main Function** (lines 84–162)

This is the core function. Here's what it does step by step:

**Step 1:** Filter out events without required fields.

**Step 2:** Parse timestamps and sort events by time.

**Step 3:** Calculate `Time_sec` — the number of seconds since the first event in the file. This creates a relative time axis starting at 0.

```ts
const diffSeconds = (timestamp.getTime() - firstTimestampMs) / 1000;
const Time_sec = Math.max(0, Math.round(diffSeconds));
```

**Step 4:** Convert speed (`V_Train`) and mode (`M_Mode`) values to numbers, and look up the mode label from `M_MODE_DICT`.

**Step 5:** Fill in missing seconds. Log events don't happen every second — there are gaps. To produce a smooth step-like graph (like a "stairs" shape), missing seconds are filled with the last known values:

```ts
for (let sec = 0; sec <= maxSec; sec += 1) {
  const current = bySecond.get(sec);
  if (current) {
    last = current;     // Use real data point
    timeline.push(current);
  } else {
    timeline.push({
      Time_sec: sec,
      V_Train: last.V_Train,  // ← carry forward last known speed
      M_Mode_value: last.M_Mode_value,
      M_Mode_label: last.M_Mode_label,
      Timestamp: last.Timestamp
    });
  }
}
```

The result is an array with one data point per second from the first to the last event.

---

### 3. Concepts

#### 🔹 Pure Functions

A **pure function** is one that:
1. Always returns the same output for the same input
2. Has no side effects (doesn't change variables outside itself, doesn't make API calls)

`transformRawEventsToChartData` is pure — you give it an array of raw events, it gives you back chart data. It doesn't modify anything outside itself.

Pure functions are easy to test and reason about.

---

#### 🔹 `Record<K, V>`

`Record<string, string>` is a TypeScript shorthand for "an object with string keys and string values":

```ts
const dict: Record<string, string> = {
  "0": "FS",
  "1": "OS"
};

dict["2"] = "SR"; // Fine
dict["x"] = 42;   // ❌ Error — must be string
```

---

#### 🔹 Data Transformation Pipeline

`transformRawEventsToChartData` is an example of a **data transformation pipeline**:

```
Raw events (messy backend data)
     ↓ filter (remove incomplete events)
     ↓ map (parse timestamps)
     ↓ sort (by time)
     ↓ map (calculate Time_sec, convert fields)
     ↓ fill gaps (carry forward last value)
     ↓
Clean chart data (ready for Recharts)
```

Each step takes the output of the previous step and transforms it further. This is a common and clean pattern in data processing.

---

### 4. Summary

`trainGraphUtils.ts` contains two exports:

1. **`M_MODE_DICT`** — a lookup table mapping ETCS mode codes to human-readable labels.
2. **`transformRawEventsToChartData(rawEvents)`** — the main transformation function that takes raw log event objects from the backend and produces a clean array of `TrainGraphDataPoint` objects suitable for the Recharts speed/mode graph.

The function handles messy real-world data: inconsistent timestamp formats, missing fields, gaps in time, and varying field name conventions — producing a consistent, complete, second-by-second dataset.

---

---

## Folder Summary

The `utils/` folder contains two files with very different responsibilities:

| File | Purpose |
|------|---------|
| `theme.ts` | Manages the dark/light theme preference (detect, apply, save, restore) |
| `trainGraphUtils.ts` | Transforms raw log events into chart-ready data points for the speed graph |

Both are **pure utility modules** — they don't import from hooks, components, or the store. They are just functions that do one thing well.
