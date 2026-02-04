# Instagram Profile Viewer

A production-grade web application that replicates the structure and behavior of an Instagram profile page using real data from the IMAI API. Built as a monorepo with a NestJS backend and Angular standalone frontend.

This project demonstrates clean architecture, signals-first reactive state management, intelligent rate-limit protection, and modern TypeScript patterns.

## Tech Stack

**Backend:**
- NestJS (Express)
- TypeScript (strict mode)
- Node.js built-in `fetch`
- In-memory caching & request throttling

**Frontend:**
- Angular (standalone components)
- Signals-first reactive state
- RxJS (for debouncing and cancellation only)
- SCSS

**Monorepo:**
- npm workspaces

## Prerequisites

- Node.js 18+ recommended

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in `apps/backend/` with the following:

```bash
# Required
IMAI_API_KEY=<YOUR_API_KEY>

# Optional (defaults shown)
IMAI_BASE_URL=https://imai.co/api/
PORT=3000
```

**Important:** 
- Replace `<YOUR_API_KEY>` with your actual IMAI API key
- Default base URL is `https://imai.co/api/` (note the trailing slash)
- Authentication uses `authkey` header (configured automatically)

### 3. Run the Application

**Run both backend and frontend:**
```bash
npm run dev
```

**Run backend only:**
```bash
npm run dev:backend
```

**Run frontend only:**
```bash
npm run dev:frontend
```

## URLs

- **Frontend:** http://localhost:4200
- **Example Profile:** http://localhost:4200/profile/mariahcarey
- **Backend API:** http://localhost:3000

## Backend API Endpoints

- `GET /health` — Health check
- `GET /search?query=<keyword>` — Search Instagram users
- `GET /profile/:username` — Get user profile information

## Architecture Highlights

**Frontend:**
- Signals-first approach for reactive UI state
- RxJS used selectively for debounced search and request cancellation
- Component-based architecture with clear separation between container and presentational components
- Structured error handling with user-friendly messages for rate limiting

**Backend:**
- Clean layered architecture (controllers, services, DTOs)
- IMAI API client with upstream rate-limit protection
- FIFO request queue: max 1 request per second to prevent 429 errors
- Short-lived caching:
  - Search results: 3 seconds per keyword
  - User profiles: 10 seconds per username
- Production-grade error handling with proper HTTP status codes

## Project Structure

```
instagram-profile-viewer/
├── apps/
│   ├── backend/          # NestJS API
│   │   └── src/
│   │       ├── imai/     # IMAI API client
│   │       └── dto/      # Data transfer objects
│   └── frontend/         # Angular application
│       └── src/
│           ├── app/
│           │   ├── pages/       # Route components
│           │   └── services/    # API services
│           └── environments/
├── package.json          # Monorepo root
└── README.md
```

## Development

The application uses npm workspaces for monorepo management. All workspace-level commands can be run from the root directory.

---

Built with TypeScript, clean architecture principles, and modern reactive patterns.
