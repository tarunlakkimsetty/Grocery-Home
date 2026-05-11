#!/usr/bin/env node

/**
 * Render Deployment Setup Script
 * Automates backend preparation for Render deployment
 * 
 * Usage: node backend/scripts/setupRenderDeployment.js
 */

const fs = require('fs');
const path = require('path');

const RENDER_DOCS_URL = 'https://render.com/docs/deploy-node-express-app';
const GITHUB_URL = 'https://github.com/settings/connections/applications';

console.log('\n🚀 Grocery Backend - Render Deployment Setup\n');
console.log('═'.repeat(60));

// Check 1: Verify GitHub is connected
console.log('\n✓ Step 1: GitHub Integration');
console.log('  Status: This app is already in a GitHub repository');
console.log('  Action: Ensure your repo is on GitHub (main/master branch)');
console.log(`  Note: GitHub URL is visible in .git/config`);

// Check 2: Backend structure
console.log('\n✓ Step 2: Backend Structure');
const backendPath = path.join(__dirname, '..');
const requiredFiles = ['package.json', 'server.js', 'app.js', 'config/config.js'];
let allFilesExist = true;

for (const file of requiredFiles) {
    const fullPath = path.join(backendPath, file);
    const exists = fs.existsSync(fullPath);
    console.log(`  ${exists ? '✓' : '✗'} ${file}`);
    if (!exists) allFilesExist = false;
}

// Check 3: package.json configuration
console.log('\n✓ Step 3: Package.json Configuration');
const packageJsonPath = path.join(backendPath, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log(`  ✓ name: ${packageJson.name}`);
console.log(`  ✓ main: ${packageJson.main || 'server.js'}`);
console.log(`  ✓ start script: ${packageJson.scripts?.start || 'NOT CONFIGURED'}`);
console.log(`  ✓ Node engines: ${packageJson.engines?.node ? packageJson.engines.node : 'NOT SPECIFIED'}`);

// Check 4: Environment variables
console.log('\n✓ Step 4: Required Environment Variables');
const requiredEnvVars = [
    { name: 'DB_HOST', type: 'database host' },
    { name: 'DB_USER', type: 'database user' },
    { name: 'DB_PASSWORD', type: 'database password (SECRET)' },
    { name: 'DB_NAME', type: 'database name' },
    { name: 'JWT_SECRET', type: 'JWT secret key (SECRET)' },
    { name: 'NODE_ENV', type: 'environment (should be "production")' }
];

for (const envVar of requiredEnvVars) {
    const isSecret = envVar.type.includes('SECRET');
    console.log(`  [ ] ${envVar.name.padEnd(20)} - ${envVar.type} ${isSecret ? '(mark as SECRET)' : ''}`);
}

// Check 5: Optional environment variables
console.log('\n✓ Step 5: Optional Environment Variables (with defaults)');
const optionalEnvVars = [
    { name: 'PORT', default: '10000', note: 'Render assigns this' },
    { name: 'JWT_EXPIRES_IN', default: '7d' },
    { name: 'RATE_LIMIT_WINDOW_MS', default: '900000' },
    { name: 'RATE_LIMIT_MAX_REQUESTS', default: '100' },
    { name: 'DB_CONNECTION_LIMIT', default: '10' },
    { name: 'ALLOWED_ORIGINS', default: 'comma-separated URLs', note: 'Add your frontend domain' }
];

for (const envVar of optionalEnvVars) {
    const note = envVar.note ? ` (${envVar.note})` : '';
    console.log(`  ${envVar.name.padEnd(25)} = ${envVar.default}${note}`);
}

// Check 6: Database setup
console.log('\n✓ Step 6: Database Setup (Critical - Must Complete)');
console.log(`
  Choose one of these options:
  
  Option A: Aiven (Recommended - Free tier)
  ─────────────────────────────────────────
  1. Go to https://aiven.io/
  2. Sign up / Log in
  3. Create MySQL service
  4. Note the following from connection details:
     - Host
     - Username
     - Password
     - Port (default 3306)
  5. Create a database named "grocery_db"
  
  Option B: AWS RDS
  ─────────────────
  1. Create MySQL 8.0 database
  2. Configure security group to allow inbound on port 3306
  3. Get the endpoint and credentials
  
  Option C: Other providers
  ─────────────────────────
  - Azure Database for MySQL
  - Google Cloud SQL  
  - DigitalOcean Managed Databases
  - Any MySQL-compatible cloud database
  
  Required database setup:
  - Database name: grocery_db
  - Character set: utf8mb4 (recommended)
  - Public access: Enabled (for Render to connect)
`);

// Check 7: Render setup instructions
console.log('\n✓ Step 7: Deploy to Render');
console.log(`
  1. Go to https://render.com
  2. Sign up / Log in with GitHub
  3. Click "New +" → "Web Service"
  4. Connect your GitHub repository
  5. Configure:
     - Name: grocery-backend
     - Root Directory: backend
     - Build Command: npm install
     - Start Command: npm start
     - Instance Type: Free (or paid)
  6. Add Environment Variables (from Step 4 & 5)
  7. Click "Deploy Web Service"
  
  After deployment:
  - Render will provide a URL: https://grocery-backend-xxx.onrender.com
  - Copy this URL for frontend CORS configuration
  - Test the API by visiting: https://grocery-backend-xxx.onrender.com/api/health
`);

// Check 8: CORS configuration
console.log('\n✓ Step 8: CORS Configuration');
console.log(`
  After getting your Render backend URL:
  1. Set ALLOWED_ORIGINS in Render environment to your frontend URL
  2. Frontend URL examples:
     - https://grocery-app-xxx.onrender.com (if frontend also on Render)
     - https://yourdomain.com (if using custom domain)
     - http://localhost:3000 (for local development testing)
  3. Restart the backend service in Render dashboard
`);

// Check 9: Verification
console.log('\n✓ Step 9: Verify Deployment');
console.log(`
  Once deployed, test these endpoints:
  
  GET  /api/health                    - Health check
  GET  /api/products                  - Get products (public)
  POST /api/auth/login                - Login (requires credentials)
  
  Check Render Dashboard > Logs for:
  - "Server running in production mode on port 10000"
  - "Connected to MySQL"
  - Any error messages
`);

// Summary
console.log('\n' + '═'.repeat(60));
console.log('\n📋 Deployment Checklist:\n');
console.log('  [ ] 1. GitHub repository is public/accessible');
console.log('  [ ] 2. Code is pushed to GitHub (main branch)');
console.log('  [ ] 3. Database is set up (Aiven, AWS RDS, etc.)');
console.log('  [ ] 4. Render account created and GitHub connected');
console.log('  [ ] 5. Render project created with correct config');
console.log('  [ ] 6. Environment variables set in Render');
console.log('  [ ] 7. Backend deployed successfully');
console.log('  [ ] 8. CORS origins configured');
console.log('  [ ] 9. API endpoints tested');
console.log('  [ ] 10. Frontend updated with backend URL');

console.log('\n💡 Pro Tips:');
console.log('  • Monitor Render logs in real-time during deployment');
console.log('  • Set database password as "SECRET" in Render dashboard');
console.log('  • Start with free plan on Render');
console.log('  • Test with Postman or curl before frontend integration');
console.log('  • Keep JWT_SECRET strong and random');

console.log('\n📚 Useful Links:');
console.log(`  • Render docs: ${RENDER_DOCS_URL}`);
console.log('  • Aiven: https://aiven.io/');
console.log('  • AWS RDS: https://aws.amazon.com/rds/mysql/');
console.log('  • This app repo: Check .git/config for GitHub URL');

console.log('\n✅ Setup script complete!\n');
console.log('Next: Follow the steps above to complete deployment.\n');
