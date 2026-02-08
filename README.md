# Instagram Profile Viewer

A modern web application that replicates Instagram's profile page UI with real search functionality and profile data from the IMAI API. Built as a monorepo with a NestJS backend and Angular 21 frontend using signals-first architecture.

## Features

✅ **Search Autocomplete** - Instagram-like dropdown with rich user info (username, full name, verified badge, avatar placeholders)  
✅ **Profile Pages** - Complete profile header with stats, bio, and profile picture  
✅ **Highlights Bar** - Instagram-style horizontal highlights with gradient borders (mocked data)  
✅ **Posts Grid** - Responsive 3-column (desktop) / 2-column (mobile) grid with hover overlays showing likes/comments (mocked data)  
✅ **Keyboard Navigation** - Arrow keys, Enter, and Escape support in search dropdown  
✅ **Loading Skeletons** - Shimmer animations for search, highlights, and posts  
✅ **Error Handling** - Graceful error states with retry buttons  
✅ **Responsive Design** - Mobile-optimized layouts with proper breakpoints  
✅ **Performance** - Frontend caching (250ms debounce), backend rate limiting (200ms), OnPush change detection

## Tech Stack

**Backend:**
- NestJS 11.0.1 (Express)
- TypeScript (strict mode)
- IMAI API integration with rate limiting
- In-memory caching (30s search, 60s profile/highlights)

**Frontend:**
- Angular 21.1.0 (standalone components)
- Signals-first reactive state
- RxJS (debouncing, switchMap for cancellation)
- SCSS with Instagram-like styling
- CSS Grid for layouts

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
- `GET /search?query=<keyword>` — Search Instagram users (returns username, fullName, profilePicUrl, isVerified, followersCount)  
- `GET /profile/:username` — Get profile info (username, fullName, bio, profilePicUrl, posts, followers, following)  
- `GET /profile/:username/highlights` — Get highlights list (mocked data for UI development)  
- `GET /proxy/image?url=<image_url>` — Proxy Instagram CDN images with HTTPS validation

## Architecture Highlights

**Frontend (Signals-First):**
- Component-based architecture with clear separation (container vs presentational)
- Signals for local state, computed for derived state, effects for side effects
- RxJS only for: debouncing (250ms), distinctUntilChanged, switchMap (request cancellation)
- Frontend caching: Map-based cache for instant repeat searches
- OnPush change detection for optimal performance
- trackBy functions on all @for loops

**Backend (Rate-Limited & Cached):**
- IMAI API client with FIFO request queue (200ms between requests)
- In-memory caching with TTL:
  - Search results: 30 seconds
  - User profiles: 60 seconds
  - Highlights: 60 seconds (mocked)
- Proper error handling with typed DTOs and HttpException
- Image proxy for Instagram CDN with allowlist validation

## Project Structure

```
instagram-profile-viewer/
├── apps/
│   ├── backend/          # NestJS API (port 3000)
│   │   └── src/
│   │       ├── imai/     # IMAI API client with rate limiting
│   │       ├── dto/      # ProfileDto
│   │       └── app.controller.ts  # All endpoints
│   └── frontend/         # Angular 21 (port 4200)
│       └── src/
│           ├── app/
│           │   ├── pages/
│           │   │   ├── home/           # Search page
│           │   │   │   └── components/  # SearchInput, SearchResultsDropdown
│           │   │   └── profile/        # Profile page
│           │   │       └── components/  # ProfileHeader, ProfileStats, ProfileBio,
│           │   │                       # ProfileHighlights, ProfilePostsGrid
│           │   └── services/           # API services (search, profile, highlights, health)
│           └── environments/
├── docs/
│   └── REQUIREMENTS_CHECKLIST.md  # Feature completion status
├── package.json          # Monorepo root with workspaces
└── README.md
```

## Implementation Notes

**UI-Only Features:**
- Highlights and Posts Grid use mocked data with realistic loading delays (300-500ms)
- Backend highlights endpoint returns stable mocked JSON
- Posts are not fetched from API (intentional scope limitation for stable demo)

**Performance Optimizations:**
- Frontend: Map-based cache, 250ms debounce, distinctUntilChanged
- Backend: 200ms rate limiting (reduced from 1s), 30-60s TTL caching
- Change detection: OnPush strategy on all components
- Lists: trackBy functions (trackByUsername, trackById) prevent unnecessary re-renders

**Error Handling:**
- Rate limit (429): User-friendly message with retry
- Network errors: Inline error states with retry buttons
- No crashes or blank screens on failures

## Development

The application uses npm workspaces for monorepo management. All workspace-level commands can be run from the root directory.

### Code Quality
- TypeScript strict mode enabled
- All console.log debug statements removed (production-ready)
- No circular dependencies in effects/signals
- Standalone components only (no NgModules)

---

Built with Angular 21 signals-first architecture, NestJS rate-limited API, and Instagram-inspired UI design.
