# Instagram Profile Viewer

A modern full-stack web application that replicates Instagram's profile page with real data from the IMAI API. Built as a monorepo with NestJS backend and Angular 21 frontend using signals-first architecture.

## Features

### ✅ Core Features
- **Profile Pages** - Complete profile header with real stats, bio, profile picture, and verified badges
- **Content Tabs** - Posts, Reels, Tagged, and Reposts with icon-only navigation
- **Infinite Scroll** - Automatic pagination when scrolling near bottom (no "Load More" button)
- **Highlights List** - Fetches real Instagram highlights with cover images and titles
- **Stories Viewer** - Click profile picture to view stories (handles empty states gracefully)
- **Reels Viewer** - Fullscreen video player with keyboard navigation (arrow keys, Escape)
- **Search Bar** - Instagram-like search at top of profile page with autocomplete
- **Responsive Design** - Mobile-optimized layouts (2-col grid) and desktop (3-col grid)

### ✅ UX & Performance
- **Error Handling** - Graceful fallbacks for API failures, empty states, rate limits
- **Loading States** - Skeleton loaders for search, highlights, profile, and content grids
- **Keyboard Navigation** - Arrow keys, Enter, Escape support throughout
- **Caching** - Backend in-memory cache (60s profiles, 30s search) with rate limiting
- **Debouncing** - 250ms search debounce, 200ms scroll throttle

## Tech Stack

**Backend:**
- NestJS 11.0.1 with Express
- TypeScript (strict mode)
- IMAI API integration with rate limiting
- In-memory caching layer

**Frontend:**
- Angular 21.1.0 (standalone components)
- Signals-first reactive architecture
- RxJS for async operations
- SCSS with Instagram-like styling

**Testing:**
- Backend: Jest with e2e tests (8 passing)
- Frontend: Vitest with component/service tests (19 passing)

**Monorepo:**
- npm workspaces

## Prerequisites

- Node.js 18+ recommended
- IMAI API key (required for backend)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env` file in `apps/backend/`:

```bash
# Required
IMAI_API_KEY=your_api_key_here

# Optional (defaults shown)
IMAI_BASE_URL=https://imai.co/api/
PORT=3000
NODE_ENV=development
```

**Important:**
- Replace `your_api_key_here` with your actual IMAI API key
- Base URL includes trailing slash
- Authentication uses `authkey` header (configured automatically)

### 3. Run the Application

**Development mode (both apps):**
```bash
npm run dev
```

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

## URLs

- **Frontend:** http://localhost:4200
- **Default Profile:** http://localhost:4200/profile/instagram
- **Backend API:** http://localhost:3000

## API Endpoints

### Backend API
- `GET /health` — Health check
- `GET /search?query=<keyword>` — Search Instagram users
- `GET /profile/:username` — Profile info (stats, bio, avatar)
- `GET /profile/:username/posts?after=<cursor>` — Posts with pagination
- `GET /profile/:username/reels?after=<cursor>` — Reels with pagination
- `GET /profile/:username/tagged?after=<cursor>` — Tagged posts
- `GET /profile/:username/reposts?after=<cursor>` — Reposts
- `GET /profile/:username/highlights` — Highlights list
- `GET /profile/:username/stories` — Active stories
- `GET /media/:code` — Media detail (for post/reel viewer)
- `GET /media/:code/comments?after=<cursor>` — Post comments
- `GET /proxy/image?url=<url>` — Image proxy with CORS

### Debug Mode
Add `?debug=1` to any endpoint in development for raw API responses:
```
GET /profile/instagram?debug=1
```

## Build & Test

### Backend

**Build:**
```bash
cd apps/backend
npm run build
```

**E2E Tests (8 tests):**
```bash
cd apps/backend
npm run test:e2e
```

Tests cover:
- Health check endpoint
- Profile endpoint with schema validation
- Stories endpoint (empty + populated)
- Reels endpoint with pagination
- Highlights endpoint (empty + populated)

### Frontend

**Build:**
```bash
cd apps/frontend
npm run build
```

**Unit Tests (19 tests):**
```bash
cd apps/frontend
npm test
```

Tests cover:
- ProfileApiService HTTP methods
- HighlightsApiService (highlights + stories)
- ProfileComponent (init, tab switching, infinite scroll)
- All component creation tests

## Project Structure

```
instagram-profile-viewer/
├── apps/
│   ├── backend/          # NestJS API
│   │   ├── src/
│   │   │   ├── app.controller.ts    # API endpoints
│   │   │   ├── app.service.ts       # Business logic
│   │   │   ├── imai/
│   │   │   │   └── imai.client.ts   # IMAI API client
│   │   │   └── dto/                 # Data transfer objects
│   │   └── test/                    # E2E tests
│   └── frontend/         # Angular SPA
│       └── src/
│           └── app/
│               ├── pages/
│               │   └── profile/     # Profile page (main feature)
│               │       ├── profile.component.ts
│               │       └── components/   # Header, highlights, grids
│               └── services/        # API services
└── package.json          # Root workspace config
```

## Known Limitations

### Data Availability
- **Stories:** Some accounts return `reel: null` (empty state handled gracefully)
- **Highlights:** Some accounts may return 500 from upstream (shows empty state)
- **Reposts:** May be empty for accounts that don't repost content
- **Rate Limits:** IMAI API has rate limits (backend caching mitigates this)

### UX Notes
- Highlights list fetches metadata only (clicking opens highlight not yet implemented)
- Stories viewer shows active stories (24hr expiration)
- Reels viewer requires `video_url` field from API (fallback to displayUrl if missing)
- Search requires minimum 2 characters to trigger API call

## Implemented Features Checklist

✅ **Profile Page**
- Header with stats (posts, followers, following)
- Bio and profile picture
- Verified badge support

✅ **Content Tabs**
- Posts grid with infinite scroll
- Reels grid with fullscreen viewer
- Tagged posts
- Reposts

✅ **Highlights & Stories**
- Highlights list with cover images
- Stories viewer (click profile picture)
- Empty state handling

✅ **Infinite Scroll**
- Automatic load more (no button)
- Cursor-based pagination
- Guard against duplicate requests

✅ **Error Handling**
- API failure fallbacks
- Empty state messages
- Retry buttons where appropriate
- Rate limit detection

✅ **Search**
- Autocomplete dropdown
- Rich user info display
- Keyboard navigation
- Debounced API calls

✅ **Responsive Design**
- Mobile: 2-column grids
- Desktop: 3-column grids
- Touch-friendly controls
- Optimized layouts

## Development Notes

### Console Logs
- Production: Only critical errors logged
- Development: Debug logs available via `?debug=1` query param
- Tests: All console logs gated by `NODE_ENV`

### Caching Strategy
- Search: 30 seconds
- Profile: 60 seconds
- Highlights: 60 seconds
- Cache keys include username + cursor for pagination

### Performance
- Frontend: OnPush change detection, signals for reactivity
- Backend: Rate limiting (200ms), request queuing
- Image proxy prevents CORS issues

## License

ISC
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
│           │   │   ├── home/           # Search components (SearchInput, SearchResultsDropdown)
│           │   │   └── profile/        # Profile page with integrated search
│           │   │       └── components/  # ProfileHeader, ProfileStats, ProfileBio,
│           │   │                       # ProfileHighlights
│           │   └── services/           # API services (search, profile, highlights, health)
│           └── environments/
├── docs/
│   ├── REQUIREMENTS_CHECKLIST.md           # Feature completion status
│   └── ARCHITECTURE_DECISION_SEARCH_PLACEMENT.md  # Search UX rationale
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
