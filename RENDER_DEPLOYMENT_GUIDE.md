# Render Deployment Guide for Grocery Backend

## Prerequisites
- Render account (render.com)
- GitHub repository with the code pushed
- MySQL database (cloud provider or managed)
- Frontend domain (for CORS configuration)

## Required Environment Variables for Render

Set these in Render Dashboard > Environment Variables:

### Critical (Must set)
- `DB_HOST` - MySQL hostname (e.g., from Aiven, AWS RDS, or any cloud MySQL provider)
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password (use secret)
- `DB_NAME` - Database name (e.g., grocery_db)
- `JWT_SECRET` - Strong random secret for JWT tokens (use secret)
- `NODE_ENV` - Set to `production`

### Optional (Pre-configured defaults)
- `PORT` - Set to 10000 (Render assigns this automatically)
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in ms (default: 900000 = 15min)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)
- `DB_CONNECTION_LIMIT` - Connection pool size (default: 10)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed frontend URLs for CORS

## Database Setup Options

### Option 1: Aiven (Recommended - Free tier available)
1. Go to aiven.io
2. Create MySQL instance
3. Get connection details (host, user, password)
4. Set in Render environment variables

### Option 2: AWS RDS
1. Create MySQL instance
2. Configure security groups
3. Get endpoint and credentials
4. Set in Render environment variables

### Option 3: Other cloud MySQL providers
- Azure Database for MySQL
- Google Cloud SQL
- DigitalOcean Managed Databases
- Any MySQL-compatible cloud provider

## Render Service Configuration

The `render.yaml` in the root directory defines:
- Service name: grocery-backend
- Runtime: Node.js
- Root directory: backend
- Build command: npm install
- Start command: npm start

## Deployment Steps

1. Ensure code is pushed to GitHub
2. Go to render.com and connect GitHub account
3. Create new Web Service
4. Select the repository
5. Configure:
   - Name: grocery-backend
   - Root Directory: backend
   - Build Command: npm install
   - Start Command: npm start
   - Environment: Node
   - Instance Type: Free (or paid)
6. Add all environment variables (see above)
7. Click Deploy

## After Deployment

1. Render will provide a URL like: https://grocery-backend-xxx.onrender.com
2. Update frontend CORS settings with this URL
3. Add this URL to ALLOWED_ORIGINS environment variable
4. Redeploy or restart the service
5. Test API endpoints

## Testing the Deployment

Once deployed, test these endpoints:
- GET /health (if available)
- GET /api/products (public endpoint)
- POST /api/auth/login (auth endpoint)

Watch logs in Render Dashboard for any errors.

## Common Issues

### "Cannot GET /"
- Normal if backend has no root route
- Test actual endpoints like /api/products

### Database Connection Error
- Verify DB credentials are correct
- Check that Render IP is whitelisted in database firewall
- Ensure database is accessible from internet

### CORS Errors in Frontend
- Add frontend URL to ALLOWED_ORIGINS
- Restart the backend service

## Production Checklist

- [ ] Database is set up and accessible from Render
- [ ] All environment variables are set in Render
- [ ] JWT_SECRET is a strong random value
- [ ] NODE_ENV is set to production
- [ ] CORS origins are configured correctly
- [ ] API endpoints are tested and working
- [ ] Logs show no errors during startup
- [ ] Database migrations/schema updates are complete
