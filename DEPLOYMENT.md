# 🚀 Deployment Guide

This guide provides step-by-step instructions for deploying the Blockchain Ledger application to various hosting platforms.

## 📋 Prerequisites

- Git repository with your code
- MongoDB Atlas account (for production database)
- Vercel account (for frontend)
- Render/Railway account (for backend)

## 🌐 Frontend Deployment (Vercel)

### 1. Prepare the Frontend

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Build for production
npm run build
```

### 2. Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Follow the prompts to configure your deployment
```

**Option B: Using Git Integration**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Configure build settings:
   - **Framework**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3. Environment Variables for Frontend

In Vercel dashboard, add these environment variables:
```
VITE_API_URL=https://your-backend-url.com/api
```

## 🖥️ Backend Deployment (Render)

### 1. Prepare the Backend

```bash
# Navigate to server directory
cd server

# Ensure package.json has correct start script
"scripts": {
  "start": "node index.js"
}
```

### 2. Deploy to Render

1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure deployment:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `server`

### 3. Environment Variables for Backend

In Render dashboard, add these environment variables:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blockchain_ledger
JWT_SECRET=your_super_secure_jwt_secret_key_here
```

## 🗄️ Database Setup (MongoDB Atlas)

### 1. Create MongoDB Atlas Cluster

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Sign up/Login and create a new cluster
3. Choose your preferred cloud provider and region
4. Select M0 (Free tier) for development

### 2. Configure Database Access

1. **Database Access**:
   - Create a database user
   - Set username and password
   - Grant read/write access

2. **Network Access**:
   - Add IP address: `0.0.0.0/0` (allow from anywhere)
   - Or add your server's IP for better security

3. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password

## ⚡ Alternative Deployment Options

### Railway (Backend Alternative)

1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Select the `server` folder as root
4. Add environment variables
5. Deploy with one click

### Netlify (Frontend Alternative)

1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your `client/dist` folder
3. Or connect GitHub for continuous deployment
4. Configure build settings similar to Vercel

## 🔧 Production Configuration

### Security Checklist

- [ ] Change JWT secret to a strong, random value
- [ ] Use HTTPS for all communications
- [ ] Configure CORS properly for your domain
- [ ] Set up rate limiting
- [ ] Enable MongoDB authentication
- [ ] Use environment variables for all secrets

### Performance Optimization

```javascript
// server/index.js - Add compression
const compression = require('compression');
app.use(compression());

// Add caching headers
app.use(express.static('public', {
  maxAge: '1y',
  etag: true
}));
```

### Monitoring and Logging

```javascript
// Add logging middleware
const morgan = require('morgan');
app.use(morgan('combined'));

// Error tracking (example with Sentry)
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**:
   ```javascript
   // server/index.js
   app.use(cors({
     origin: ['https://your-frontend-domain.com'],
     credentials: true
   }));
   ```

2. **Environment Variables Not Loading**:
   - Ensure `.env` file is in correct location
   - Check environment variable names match exactly
   - Restart server after adding new variables

3. **Database Connection Issues**:
   - Verify MongoDB connection string
   - Check network access settings
   - Ensure database user has correct permissions

4. **Build Failures**:
   - Check Node.js version compatibility
   - Clear `node_modules` and reinstall
   - Verify all dependencies are listed in `package.json`

### Health Check Endpoints

Add these to your backend for monitoring:

```javascript
// server/routes/health.js
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/health/db', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ database: 'connected' });
  } catch (error) {
    res.status(500).json({ database: 'disconnected' });
  }
});
```

## 📊 Post-Deployment Steps

1. **Test All Functionality**:
   - User registration and login
   - Transaction creation
   - Blockchain operations
   - Smart contract execution

2. **Performance Testing**:
   - Load testing with tools like Artillery or k6
   - Monitor response times
   - Check database performance

3. **Set Up Monitoring**:
   - Application performance monitoring (APM)
   - Error tracking and logging
   - Uptime monitoring

4. **Backup Strategy**:
   - Set up automated database backups
   - Document recovery procedures
   - Test backup restoration process

## 🔄 Continuous Deployment

Set up automatic deployments when you push to main branch:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd client && npm ci && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      # Backend deployment steps for your chosen platform
```

---

**Need help?** Check our [Contributing Guide](CONTRIBUTING.md) or open an issue on GitHub!