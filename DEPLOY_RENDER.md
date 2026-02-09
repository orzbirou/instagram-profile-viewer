# Render Deployment Guide

This guide covers deploying both backend and frontend to Render.

## Prerequisites

- Render account (free tier works)
- IMAI API key
- GitHub repository connected to Render

## Architecture

```
Backend:  https://<backend-name>.onrender.com
Frontend: https://<frontend-name>.onrender.com
```

Frontend makes API calls to backend URL (configured at build time).

---

## Step 1: Deploy Backend (Web Service)

### 1.1 Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `instagram-backend` (or your choice)
   - **Root Directory**: `apps/backend`
   - **Environment**: `Node`
   - **Build Command**: 
     ```bash
     npm ci && npm run build
     ```
   - **Start Command**: 
     ```bash
     npm run start:prod
     ```

### 1.2 Set Environment Variables

In the **Environment** section, add:

| Key | Value | Required |
|-----|-------|----------|
| `NODE_ENV` | `production` | ✅ Required |
| `IMAI_API_KEY` | `your_actual_imai_api_key` | ✅ Required |
| `CORS_ORIGIN` | `https://your-frontend.onrender.com` | ✅ Required |
| `PORT` | Auto-set by Render | Auto |

**Important:** 
- Replace `your-frontend.onrender.com` with your actual frontend URL (you'll get this after deploying frontend)
- You can update `CORS_ORIGIN` later after creating the frontend service
- Multiple origins: `https://frontend1.onrender.com,https://frontend2.onrender.com`

### 1.3 Health Check

Set health check path: `/health`

### 1.4 Deploy

Click **Create Web Service**. Wait for build to complete (~2-3 minutes).

**Save the backend URL**: `https://your-backend.onrender.com`

---

## Step 2: Deploy Frontend (Static Site)

### 2.1 Create New Static Site

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Static Site**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `instagram-frontend` (or your choice)
   - **Root Directory**: `apps/frontend`
   - **Build Command**: 
     ```bash
     npm ci && node scripts/render-set-env.mjs && npm run build
     ```
   - **Publish Directory**: `dist/frontend/browser`

**Note about Publish Directory:**
- Check your `apps/frontend/angular.json` → `outputPath` to confirm the exact path
- Common patterns: `dist/frontend/browser` or `dist/browser`
- If build fails, check Render logs for the actual output directory

### 2.2 Set Environment Variables

In the **Environment** section, add:

| Key | Value | Required |
|-----|-------|----------|
| `BACKEND_URL` | `https://your-backend.onrender.com` | ✅ Required |

**Replace with your actual backend URL from Step 1.4**

### 2.3 Deploy

Click **Create Static Site**. Wait for build to complete (~3-5 minutes).

**Save the frontend URL**: `https://your-frontend.onrender.com`

---

## Step 3: Update Backend CORS

After frontend is deployed:

1. Go to your backend service in Render dashboard
2. Navigate to **Environment** tab
3. Update `CORS_ORIGIN` with your actual frontend URL:
   ```
   https://your-frontend.onrender.com
   ```
4. Click **Save Changes**
5. Service will automatically redeploy

---

## Step 4: Verify Deployment

### 4.1 Test Backend

Open in browser:
```
https://your-backend.onrender.com/health
```

Expected response:
```json
{ "status": "ok" }
```

### 4.2 Test Frontend

Open in browser:
```
https://your-frontend.onrender.com/profile/instagram
```

### 4.3 Verify API Calls

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Navigate to frontend URL
4. Check that API requests go to `your-backend.onrender.com` (NOT localhost)
5. Verify no CORS errors in Console

### 4.4 Test SPA Routing

Direct URL navigation should work:
```
https://your-frontend.onrender.com/profile/instagram
```

Refresh the page - should NOT show 404.

---

## Troubleshooting

### ❌ CORS Errors

**Symptom:** Console shows "Access to XMLHttpRequest blocked by CORS policy"

**Fix:**
1. Check backend `CORS_ORIGIN` env var matches frontend URL exactly
2. Ensure frontend URL includes `https://` (no trailing slash)
3. Backend logs should show: `[CORS] Allowed origins: ['https://...']`

### ❌ 404 on Direct URL Access

**Symptom:** `/profile/instagram` works from homepage but 404 on direct access

**Fix:**
1. Verify `_redirects` file is in `dist` folder after build
2. Check Render build logs for: "Copied _redirects"
3. Ensure `angular.json` assets include `_redirects`

### ❌ Frontend Makes Requests to Localhost

**Symptom:** Network tab shows requests to `http://localhost:3000`

**Fix:**
1. Check frontend build logs: "Generated environment.production.ts"
2. Verify `BACKEND_URL` env var is set in Render
3. Run `node scripts/render-set-env.mjs` succeeded in build
4. Rebuild frontend service

### ❌ Backend Crashes on Startup

**Symptom:** Service shows "Deploy failed" or keeps restarting

**Fix:**
1. Check Render logs for error details
2. Verify all required env vars are set (`IMAI_API_KEY`, `NODE_ENV`)
3. Ensure build completed successfully
4. Check health endpoint is responding

### ❌ Backend Build Fails

**Symptom:** "Module not found" or TypeScript errors

**Fix:**
1. Ensure `npm ci` runs before `npm run build`
2. Check package.json scripts in `apps/backend`:
   - `"build": "nest build"`
   - `"start:prod": "node dist/main"`
3. Verify root `package.json` includes backend workspace

### ❌ Frontend Build Fails

**Symptom:** "environment.production.ts" or module resolution errors

**Fix:**
1. Check `BACKEND_URL` env var is set
2. Run manually: `node apps/frontend/scripts/render-set-env.mjs`
3. Verify script has execute permissions
4. Check Angular configuration is correct

---

## Local Production Testing

### Test Backend Locally

```bash
cd apps/backend
NODE_ENV=production PORT=3000 CORS_ORIGIN=http://localhost:4200 npm run start:prod
```

### Test Frontend Locally

```bash
cd apps/frontend

# Set backend URL
export BACKEND_URL=http://localhost:3000  # Unix/Mac
# OR
set BACKEND_URL=http://localhost:3000     # Windows CMD
# OR
$env:BACKEND_URL="http://localhost:3000"  # Windows PowerShell

# Generate production environment
node scripts/render-set-env.mjs

# Build
npm run build

# Serve (requires http-server or similar)
npx http-server dist/frontend/browser -p 4200
```

---

## Updating Deployed Services

### Update Backend Code

1. Push changes to GitHub
2. Render auto-deploys (if auto-deploy enabled)
3. Or manually click **Deploy latest commit**

### Update Frontend Code

1. Push changes to GitHub
2. Render auto-deploys and runs build script
3. Environment variables persist across deploys

### Update Environment Variables

1. Go to service → **Environment** tab
2. Update values
3. Click **Save Changes** (triggers redeploy)

---

## Monitoring

### View Logs

- Backend logs: Service → **Logs** tab
- Frontend build logs: Site → **Events** tab

### Check Service Status

- Dashboard shows: `Live`, `Building`, `Failed`
- Green indicator = healthy

### Set Up Alerts (Optional)

1. Service → **Settings** → **Notifications**
2. Add email/Slack for deploy failures

---

## Free Tier Limitations

- Backend (Web Service):
  - Sleeps after 15 minutes of inactivity
  - First request after sleep takes ~30 seconds
  - 750 hours/month free

- Frontend (Static Site):
  - Always on
  - 100 GB bandwidth/month free
  - No sleep timer

**Tip:** Upgrade to paid plan ($7/month) to eliminate backend sleep.

---

## Security Checklist

✅ `NODE_ENV=production` set in backend  
✅ `CORS_ORIGIN` set to specific frontend URL (not `*`)  
✅ `IMAI_API_KEY` stored as environment variable (not hardcoded)  
✅ Backend uses `https://` URLs only  
✅ No sensitive data in frontend code  
✅ `credentials: false` in CORS (unless using auth)  

---

## URLs Summary

After deployment, you'll have:

- **Backend API**: `https://your-backend.onrender.com`
- **Frontend App**: `https://your-frontend.onrender.com`
- **Health Check**: `https://your-backend.onrender.com/health`
- **Example Profile**: `https://your-frontend.onrender.com/profile/instagram`

---

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community Forum](https://community.render.com/)
- [Angular Deployment Guide](https://angular.io/guide/deployment)
- [NestJS Deployment](https://docs.nestjs.com/faq/serverless)

---

Built with ❤️ using Angular 21 + NestJS on Render
