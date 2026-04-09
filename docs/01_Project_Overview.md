# 01 — Project Overview

> **Who is this for?** Complete beginners in web development. No prior knowledge assumed.

---

## What is this project?

**RBC Log Analyzer** is a web application for railway engineers and validators.

It helps teams **analyze ERTMS/ETCS communication logs** produced by an RBC
(Radio Block Centre) — the system that controls train movements in a railway zone.
The logs are XML files that record every message exchanged between the RBC and
the on-board train equipment (OBU).

Without this tool, reading those XML files manually would take hours.
This app lets you upload a file and immediately search, filter, and visualize the events inside it.

---

## Main Features

| Feature | What it does |
|---------|-------------|
| **Import Files** | Upload XML log files (up to 500 MB) via a drag-and-drop zone |
| **Event Browser** | Search and filter the events recorded in a file; filter by train ID, timestamp, message code, or free text |
| **Train Graph** | View a speed/mode chart for a selected train over time |
| **Scenarios** | Create and manage test scenarios — sequences of expected events used to validate train behavior |
| **Reports** | (In progress) Generate analysis reports from imported files |
| **Users** | Validators can create accounts, assign roles, and manage access |
| **Audit Logs** | Every action (upload, delete, login…) is recorded and can be reviewed |
| **Settings** | Change your password and toggle dark/light mode |

---

## Two parts: Frontend and Backend

The project has two completely separate programs that communicate with each other over the internet
using a protocol called **HTTP** (the same protocol your browser uses to load web pages).

```
┌──────────────────────────────────────┐
│            YOUR BROWSER              │
│                                      │
│   React Frontend                     │
│   Runs at: http://localhost:5173     │
└───────────────┬──────────────────────┘
                │
                │  HTTP requests and responses (JSON data)
                │  e.g. GET /imports  →  list of uploaded files
                │  e.g. POST /auth/login  →  { token: "..." }
                │
┌───────────────▼──────────────────────┐
│            PYTHON BACKEND            │
│                                      │
│   FastAPI + MongoDB                  │
│   Runs at: http://localhost:8000     │
└──────────────────────────────────────┘
```

### The Backend (Python / FastAPI)
- Located in the `backend/` folder.
- Written in **Python** using the **FastAPI** framework.
- Uses **MongoDB** as the database to store users, files, scenarios, and audit logs.
- Exposes a **REST API** — a set of URLs the frontend calls to get or save data.
- You do **not** need to understand the backend to read the frontend code.

### The Frontend (React / TypeScript)
- Located in the `frontend/` folder — **this is what all the docs in this folder explain**.
- Written in **React** and **TypeScript** (a stricter version of JavaScript).
- Runs entirely inside the browser — no Python is needed to display the UI.
- Built and served by **Vite**, a fast development tool.
- Communicates with the backend by sending HTTP requests, then shows the results on screen.

---

## How the Frontend Connects to the Backend

Every time the app needs data, it follows this path:

```
User does something (e.g. clicks "Upload File")
          ↓
Page component calls a custom hook  (e.g. useImports)
          ↓
Hook calls an API function          (e.g. uploadImportApi)
          ↓
API function calls apiRequest()     (the central HTTP client)
          ↓
apiRequest() sends a POST request to  http://localhost:8000/imports
          ↓
Backend processes the file and returns  { data: { file_id: "abc123" } }
          ↓
apiRequest() parses the JSON response
          ↓
TanStack Query updates the cache
          ↓
React re-renders the page with the new file in the list
```

The key file for all HTTP communication is:
`frontend/src/services/api/client.ts` — the `apiRequest()` function.

All backend URL paths are defined in one place:
`frontend/src/services/api/endpoints.ts`

---

## Technology Stack

| Technology | What it is | Why it is used |
|------------|------------|---------------|
| **React 18** | JavaScript UI library | Builds the interactive user interface from reusable components |
| **TypeScript** | JavaScript with types | Catches bugs at development time, makes code easier to read |
| **Vite** | Build tool | Provides a fast development server and bundles the app for production |
| **React Router v6** | Routing library | Shows different pages depending on the URL without reloading |
| **TanStack Query v5** | Data-fetching library | Manages all API calls, handles loading/error states, and caches results |
| **Recharts** | Chart library | Draws the train speed and mode graphs on the Events page |
| **Font Awesome** | Icon library | All the icons (upload icon, trash icon, gear icon, etc.) |

---

## User Roles

The app has two types of users with different levels of access:

| Role | Permissions |
|------|-------------|
| **Validator** (Admin) | Full access: manage users, approve password resets, view audit logs, see all uploaded files |
| **Engineer** (Standard) | Can upload files, browse events, create scenarios, and generate reports |

Access control is enforced both on the frontend (route guards prevent navigation)
and on the backend (the API rejects unauthorized requests).

---

## Folder Map

```
project root/
├── backend/             Python FastAPI server
├── frontend/            React application  ← documented here
│   ├── index.html       The single HTML page the browser loads
│   └── src/
│       ├── main.tsx         Entry point — starts React
│       ├── App.tsx          Root component
│       ├── app/             Router, guards, providers
│       ├── pages/           One file per page (Dashboard, Login, etc.)
│       ├── components/      Small reusable UI elements
│       ├── hooks/           Custom React hooks (data-fetching logic)
│       ├── services/        HTTP client and API functions
│       ├── store/           Global authentication state
│       ├── layouts/         Sidebar + navbar shell
│       ├── config/          URL paths and environment constants
│       ├── types/           TypeScript type definitions
│       ├── utils/           Helper functions (theme, chart data)
│       └── styles/          Global CSS stylesheet
└── docs/                ← You are here
    ├── 01_Project_Overview.md  (this file)
    └── ...
```

---

## How to Run the Frontend Locally

```bash
# 1. Go to the frontend folder
cd frontend

# 2. Install all dependencies (only needed once)
npm install

# 3. Start the development server
npm run dev
# Opens at http://localhost:5173
```

> The Python backend must also be running on port 8000 for API calls to work.
> Without it, you will see loading/error states but the UI will still render.
