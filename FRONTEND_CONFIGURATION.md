# Frontend Configuration for Render Backend

After the backend is deployed to Render, update the frontend with the correct API URL.

## Environment Variables

Create or update `.env.local` in the `grocery-app/` directory:

```env
# Backend API URL from Render deployment
REACT_APP_API_URL=https://grocery-backend-xyz123.onrender.com

# Optional - for development vs production
REACT_APP_ENV=production
```

Replace `https://grocery-backend-xyz123.onrender.com` with your actual Render backend URL.

## How to Find Your Backend URL

After deploying to Render:
1. Go to https://render.com/dashboard
2. Click on "grocery-backend" service
3. Look for the URL at the top (shown as "Service URL")
4. It will look like: `https://grocery-backend-xyz123.onrender.com`
5. Copy this entire URL

## Update Frontend Code

### If Using Existing API Configuration

Find wherever `REACT_APP_API_URL` or similar is used:

```javascript
// Example in your code (location varies by your setup)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// All API calls use this
const response = await fetch(`${API_BASE_URL}/api/products`);
```

### If No Configuration Exists

Add API URL configuration to your main app file or API service:

```javascript
// grocery-app/src/services/api.js (or similar)
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Then use in fetch calls
const response = await fetch(`${API_BASE_URL}/api/products`);
```

## Deployment Options for Frontend

### Option 1: Deploy Frontend to Render (Recommended)
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - Root Directory: `grocery-app`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start` (or `serve -s build` for production)
5. Add environment variable:
   ```
   REACT_APP_API_URL = https://grocery-backend-xyz123.onrender.com
   ```
6. Deploy

### Option 2: Deploy Frontend to Vercel (Alternative)
1. Go to https://vercel.com
2. Import your GitHub repository
3. Set build settings:
   - Framework: React
   - Root Directory: grocery-app
4. Add environment variable:
   ```
   REACT_APP_API_URL = https://grocery-backend-xyz123.onrender.com
   ```
5. Deploy

### Option 3: Run Frontend Locally
1. Update `.env.local` with backend URL
2. Run:
   ```bash
   cd grocery-app
   npm install
   npm start
   ```
3. Frontend will be at `http://localhost:3000`
4. API calls will go to your Render backend

## Testing the Integration

After updating the frontend with the backend URL:

1. **Local Testing**
   ```bash
   cd grocery-app
   npm start
   ```
   - Open browser to http://localhost:3000
   - Check browser Console for errors
   - Make a test API call (like loading products)

2. **Production Testing**
   - Deploy to Render/Vercel or use live URL
   - Test all main features
   - Check Network tab to see API calls
   - Verify no CORS errors

3. **Common Issues**
   
   **CORS Error in Console:**
   ```
   Access to XMLHttpRequest at 'https://...' from origin 'https://...' 
   has been blocked by CORS policy
   ```
   Fix: Add frontend URL to backend's `ALLOWED_ORIGINS` environment variable
   
   **API Not Responding:**
   - Check if backend URL is correct
   - Verify backend is "Live" in Render dashboard
   - Check backend health: `https://backend-url/api/health`
   
   **Timeout Errors:**
   - Backend might be waking up (free tier)
   - Wait 30 seconds and try again
   - Consider upgrading to paid plan

## Quick Command Reference

```bash
# Set backend URL for local development
# In grocery-app/.env.local:
# REACT_APP_API_URL=http://localhost:5000

# Set backend URL for production
# In grocery-app/.env.local:
# REACT_APP_API_URL=https://grocery-backend-xyz123.onrender.com

# Start frontend locally
cd grocery-app
npm start

# Build for production
cd grocery-app
npm run build

# Test API endpoint in terminal
curl https://grocery-backend-xyz123.onrender.com/api/health
```

## Environment Variable Reference

| Variable | Development | Production |
|----------|-------------|-----------|
| `REACT_APP_API_URL` | `http://localhost:5000` | `https://grocery-backend-xyz123.onrender.com` |
| `REACT_APP_ENV` | `development` | `production` |

## Notes

- Update `.env.local` when switching between development and production
- `.env.local` is git-ignored (never commit with real URLs)
- Each frontend deployment needs the correct backend URL
- If backend URL changes, redeploy frontend or update environment variables

---

**Next Steps:**
1. Get your backend URL from Render after deployment
2. Update `.env.local` in grocery-app
3. Test locally first
4. Deploy frontend to Render/Vercel or run locally
5. Verify all API calls work
