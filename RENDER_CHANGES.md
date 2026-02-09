# Render Deployment Changes Summary

## Files Modified

### Backend Changes

**`apps/backend/src/main.ts`**
- Listen on `0.0.0.0:${PORT}` for Render compatibility
- Parse `CORS_ORIGIN` environment variable (comma-separated)
- Development fallback: `http://localhost:4200`
- Production: Secure by default (denies all if no CORS_ORIGIN set)
- Added logging for CORS configuration

### Frontend Changes

**`apps/frontend/src/environments/environment.production.ts`**
- Changed to empty `apiBaseUrl: ''` (placeholder)
- Added comment explaining auto-generation by build script
- Will be replaced during Render build

**`apps/frontend/src/_redirects`** (NEW)
- Netlify/Render-style redirects file
- Enables SPA routing: `/* /index.html 200`
- Ensures direct URL access works (e.g., `/profile/instagram`)

**`apps/frontend/scripts/render-set-env.mjs`** (NEW)
- Node.js script to inject backend URL at build time
- Reads `BACKEND_URL` from environment variable
- Validates URL format (must be `https://` or `http://localhost`)
- Writes `environment.production.ts` before Angular build
- Exits with clear error messages if misconfigured

**`apps/frontend/angular.json`**
- Added `_redirects` to assets array
- Copies `src/_redirects` to `dist/` during build
- Required for SPA routing on static hosts

### Documentation

**`DEPLOY_RENDER.md`** (NEW)
- Complete step-by-step deployment guide
- Backend Web Service setup
- Frontend Static Site setup
- Environment variables configuration
- Troubleshooting section with common issues
- Local production testing instructions
- Monitoring and maintenance tips

## No Changes Needed

✅ **All API Services Already Compatible**
- `profile-api.service.ts` - uses `environment.apiBaseUrl`
- `highlights-api.service.ts` - uses `environment.apiBaseUrl`
- `search-api.service.ts` - uses `environment.apiBaseUrl`
- `health-api.service.ts` - uses `environment.apiBaseUrl`

✅ **Environment Switching Works**
- Angular's `fileReplacements` in production mode
- Automatically swaps `environment.ts` → `environment.production.ts`
- No code changes needed in services

## Deployment Workflow

### Backend (Render Web Service)

```bash
# Build command
npm ci && npm run build

# Start command
npm run start:prod

# Environment variables
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.onrender.com
IMAI_API_KEY=your_key
```

### Frontend (Render Static Site)

```bash
# Build command (3 steps)
npm ci && node scripts/render-set-env.mjs && npm run build

# Publish directory
dist/frontend/browser

# Environment variables
BACKEND_URL=https://your-backend.onrender.com
```

## How It Works

1. **Backend CORS**: Reads `CORS_ORIGIN` env var → allows frontend domain
2. **Frontend Build**: 
   - `render-set-env.mjs` reads `BACKEND_URL`
   - Writes `environment.production.ts` with backend URL
   - Angular build uses production environment
   - All API calls go to Render backend URL
3. **SPA Routing**: `_redirects` file ensures Render serves `index.html` for all routes

## Local Development Unaffected

- `environment.ts` still points to `http://localhost:3000`
- Backend defaults to port 3000 and allows localhost:4200
- No changes to `npm run dev` workflow

## Security

✅ CORS restricted to specific frontend origin  
✅ No hardcoded URLs in code  
✅ Environment variables for sensitive config  
✅ HTTPS enforced in production  

## Testing Checklist

After deployment:

- [ ] Backend health endpoint: `https://backend.onrender.com/health`
- [ ] Frontend loads: `https://frontend.onrender.com`
- [ ] Profile page works: `https://frontend.onrender.com/profile/instagram`
- [ ] API calls go to backend URL (check DevTools Network tab)
- [ ] No CORS errors in Console
- [ ] Direct URL navigation works (refresh on `/profile/instagram`)
- [ ] Search functionality works (makes requests to backend)

## Rollback

If deployment fails, you can rollback by:
1. Reverting `apps/backend/src/main.ts` to simple `app.enableCors()`
2. Keeping `environment.production.ts` with hardcoded URL
3. Removing `_redirects` and build script

But the changes are minimal and production-tested patterns, so rollback shouldn't be needed.
