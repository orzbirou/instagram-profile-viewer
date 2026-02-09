# GitHub Pages Deployment Guide

## Overview

This guide covers deploying the Angular frontend to GitHub Pages with the backend hosted on Render.

**Live URLs:**
- Frontend: https://orzbirou.github.io/instagram-profile-viewer/
- Backend: https://instagram-profile-viewer-stlk.onrender.com

---

## Prerequisites

✅ Backend deployed on Render at: `https://instagram-profile-viewer-stlk.onrender.com`  
✅ GitHub repository: `orzbirou/instagram-profile-viewer`  
✅ Code pushed to `master` branch

---

## Step 1: Enable GitHub Pages

1. Go to your GitHub repository: https://github.com/orzbirou/instagram-profile-viewer
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Build and deployment**:
   - **Source**: Select "GitHub Actions"
   - (Do NOT use "Deploy from a branch" - use GitHub Actions)
4. Click **Save**

That's it! The workflow will handle the rest.

---

## Step 2: Push Code (Triggers Auto-Deploy)

The GitHub Actions workflow (`.github/workflows/deploy-gh-pages.yml`) automatically runs on:
- Every push to `master` branch
- Manual trigger via Actions tab

```bash
git add .
git commit -m "feat: configure GitHub Pages deployment"
git push origin master
```

---

## Step 3: Monitor Deployment

1. Go to **Actions** tab: https://github.com/orzbirou/instagram-profile-viewer/actions
2. Click on the latest workflow run: "Deploy Frontend to GitHub Pages"
3. Watch the build progress:
   - ✅ Build job (install → build → upload artifact)
   - ✅ Deploy job (deploy to GitHub Pages)
4. Deployment takes ~2-3 minutes

---

## Step 4: Update Backend CORS

After GitHub Pages is live, update your Render backend to allow the GitHub Pages origin.

### Update Render Environment Variables

1. Go to Render Dashboard: https://dashboard.render.com
2. Select your backend service: `instagram-profile-viewer-stlk`
3. Click **Environment** tab
4. Find `CORS_ORIGIN` and update to:
   ```
   https://orzbirou.github.io
   ```
   (No trailing slash, no path - just the origin)

5. Click **Save Changes** (backend will redeploy automatically)

---

## Step 5: Verify Deployment

### 5.1 Check GitHub Pages URL

Open in browser:
```
https://orzbirou.github.io/instagram-profile-viewer/
```

**Expected behavior:**
- Page loads successfully
- Redirects to `/instagram-profile-viewer/profile/instagram` (default profile)

### 5.2 Verify API Calls

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Reload the page
4. Check API requests:
   - ✅ Should go to: `https://instagram-profile-viewer-stlk.onrender.com/...`
   - ❌ Should NOT go to: `localhost:3000`

### 5.3 Check for CORS Errors

In **Console** tab:
- ✅ No CORS errors
- ✅ Profile data loads successfully

If you see CORS errors, verify Step 4 (backend CORS_ORIGIN).

### 5.4 Test Profile Page

Navigate to:
```
https://orzbirou.github.io/instagram-profile-viewer/profile/instagram
```

**Expected:**
- Profile header loads
- Posts grid appears
- Search bar works
- No errors in console

---

## How It Works

### Build Configuration

The `deploy:gh-pages` script in `package.json` builds Angular with:
- `--base-href /instagram-profile-viewer/` → Sets the base path for routing
- `--deploy-url /instagram-profile-viewer/` → Sets asset URLs (CSS, JS)

This ensures all assets and routes work correctly under the GitHub Pages subdirectory.

### GitHub Actions Workflow

1. **Trigger**: Push to `master` or manual dispatch
2. **Install**: `npm ci` (installs all dependencies including workspaces)
3. **Build**: Runs `npm run deploy:gh-pages`
4. **Upload**: Creates Pages artifact from `apps/frontend/dist/frontend/browser`
5. **Deploy**: Publishes artifact to GitHub Pages

### Environment Configuration

**Local Development** (`environment.ts`):
```typescript
apiBaseUrl: 'http://localhost:3000'
```

**Production** (`environment.production.ts`):
```typescript
apiBaseUrl: 'https://instagram-profile-viewer-stlk.onrender.com'
```

Angular's file replacement swaps these at build time.

---

## Updating the Deployment

### After Code Changes

```bash
git add .
git commit -m "your changes"
git push origin master
```

GitHub Actions automatically rebuilds and redeploys.

### Manual Redeploy (No Code Changes)

1. Go to **Actions** tab
2. Click "Deploy Frontend to GitHub Pages"
3. Click **Run workflow** button
4. Select `master` branch
5. Click **Run workflow**

---

## Troubleshooting

### ❌ 404 on GitHub Pages URL

**Symptom:** `https://orzbirou.github.io/instagram-profile-viewer/` shows 404

**Fixes:**
1. Check GitHub Pages is enabled (Settings → Pages)
2. Verify workflow completed successfully (Actions tab)
3. Confirm artifact was uploaded (check workflow logs)
4. Wait 2-3 minutes after first deploy

### ❌ Blank Page / Assets Not Loading

**Symptom:** Page loads but shows nothing, 404 errors for JS/CSS files

**Fixes:**
1. Check `--base-href` and `--deploy-url` match repo name exactly
2. Verify build output path: `apps/frontend/dist/frontend/browser`
3. Check Network tab for correct asset URLs:
   - ✅ Correct: `/instagram-profile-viewer/main-ABC123.js`
   - ❌ Wrong: `/main-ABC123.js`

### ❌ CORS Errors

**Symptom:** Console shows "blocked by CORS policy"

**Fixes:**
1. Update Render backend `CORS_ORIGIN` to: `https://orzbirou.github.io`
2. Ensure no trailing slash
3. Wait for backend to redeploy (~1 minute)
4. Hard refresh browser (Ctrl+Shift+R)

### ❌ API Calls Go to Localhost

**Symptom:** Network tab shows requests to `localhost:3000`

**Fixes:**
1. Verify `environment.production.ts` has correct `apiBaseUrl`
2. Ensure production build runs (not development)
3. Check `angular.json` file replacements are correct
4. Rebuild: `npm run deploy:gh-pages`

### ❌ Routes Don't Work (404 on Refresh)

**Symptom:** `/profile/instagram` works from homepage but 404 on direct access

**GitHub Pages Fix:**
GitHub Pages doesn't have server-side routing like Render Static Sites. Angular's `_redirects` file doesn't work here.

**Solution:** Use hash-based routing (optional, not implemented):
```typescript
// In app.config.ts
provideRouter(routes, withHashLocation())
```

**Or:** Accept that direct URL access shows 404, users must enter via homepage.

**Current Status:** Uses path-based routing. Direct links may 404 on GitHub Pages (this is a GitHub Pages limitation).

### ❌ Build Fails in GitHub Actions

**Symptom:** Workflow shows red X, build job failed

**Fixes:**
1. Check error in workflow logs
2. Verify `package.json` scripts are correct
3. Test build locally: `npm run deploy:gh-pages`
4. Ensure all dependencies are in `package.json` (not just devDependencies)

---

## Local Testing of Production Build

Test the production build locally before deploying:

```bash
# Build with GitHub Pages config
npm run deploy:gh-pages

# Serve locally (requires http-server)
npx http-server apps/frontend/dist/frontend/browser -p 8080

# Open in browser
# http://localhost:8080/instagram-profile-viewer/
```

**Note:** Local testing uses localhost backend unless you modify `environment.production.ts`.

---

## Comparison: Render vs GitHub Pages

| Feature | Render Static Site | GitHub Pages |
|---------|-------------------|--------------|
| **Cost** | Free (100GB/month) | Free (1GB storage) |
| **Custom Domain** | Easy (CNAME) | Easy (CNAME) |
| **SPA Routing** | ✅ Full support (`_redirects`) | ⚠️ Limited (404s on refresh) |
| **Build Time** | ~3-5 minutes | ~2-3 minutes |
| **Auto Deploy** | ✅ On push | ✅ Via GitHub Actions |
| **Environment Vars** | ✅ Supported | ❌ Not supported (build-time only) |
| **Best For** | SPAs with routing | Static sites, simple apps |

**Current Setup:** GitHub Pages (free, automated via Actions)

---

## Advanced: Custom Domain

### Add Custom Domain to GitHub Pages

1. Go to Settings → Pages
2. Under **Custom domain**, enter: `yourdomain.com`
3. Add CNAME record in your DNS provider:
   ```
   CNAME: www.yourdomain.com → orzbirou.github.io
   ```
4. Enable **Enforce HTTPS** (wait for DNS propagation)

### Update Backend CORS

Change Render `CORS_ORIGIN` to:
```
https://yourdomain.com
```

---

## Monitoring

### View Deployment History

1. Go to **Actions** tab
2. Click "Deploy Frontend to GitHub Pages"
3. See all past deployments with timestamps

### Check Live Site Status

- GitHub Pages Status: https://www.githubstatus.com
- Backend Status: Check Render dashboard logs

---

## Rollback

To rollback to a previous version:

1. Go to **Actions** tab
2. Find the successful deployment you want to restore
3. Click **Re-run all jobs**
4. Or: revert the commit and push

---

## Summary

**Deployment URLs:**
- Frontend: https://orzbirou.github.io/instagram-profile-viewer/
- Backend: https://instagram-profile-viewer-stlk.onrender.com
- Health: https://instagram-profile-viewer-stlk.onrender.com/health

**Auto-Deploy:**
✅ Push to `master` → Automatic deployment via GitHub Actions

**Manual Deploy:**
Actions tab → Deploy Frontend to GitHub Pages → Run workflow

**CORS Setup:**
Backend `CORS_ORIGIN` = `https://orzbirou.github.io`

---

Built with ❤️ using Angular 21 + GitHub Actions + Render
