# RecordCrate Deployment Guide

## Backend Deployment (Render)

### Initial Setup

1. **Connect Repository to Render**
   - Go to [render.com](https://render.com) and sign in
   - Click **New +** → **Blueprint**
   - Connect your GitHub repository: `A71as/RecordCrate`
   - Render will automatically detect `render.yaml` and configure the service

2. **Set Environment Variables**
   
   In the Render Dashboard, navigate to your `recordcrate-api` service and add these environment variables:

   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/recordcrate?retryWrites=true&w=majority
   CORS_ORIGIN=https://your-app.netlify.app,https://*.netlify.app
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   AUTH0_DOMAIN=your-domain.auth0.com
   AUTH0_CLIENT_ID=your_auth0_client_id
   AUTH0_CLIENT_SECRET=your_auth0_client_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **MongoDB Atlas Configuration**
   - Log into [MongoDB Atlas](https://cloud.mongodb.com)
   - Go to Network Access → Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for Render compatibility
   - Or add Render's specific IP ranges if preferred

4. **Deploy**
   - The service will automatically deploy when you push to `main`
   - Your API will be available at: `https://recordcrate-api.onrender.com`

### Testing Backend

```bash
# Health check
curl https://recordcrate-api.onrender.com/api/health

# Test reviews endpoint
curl https://recordcrate-api.onrender.com/api/reviews
```

---

## Frontend Deployment (Netlify)

### Initial Setup

1. **Connect Repository to Netlify**
   - Go to [netlify.com](https://www.netlify.com) and sign in
   - Click **Add new site** → **Import an existing project**
   - Connect to GitHub and select `A71as/RecordCrate`

2. **Build Settings** (should auto-detect from netlify.toml)
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: leave empty

3. **Set Environment Variables**

   In Netlify Dashboard → Site settings → Environment variables, add:

   ```
   VITE_API_BASE_URL=https://recordcrate-api.onrender.com
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   VITE_SPOTIFY_REDIRECT_URI=https://your-app.netlify.app/callback
   VITE_AUTH0_DOMAIN=your-domain.auth0.com
   VITE_AUTH0_CLIENT_ID=your_auth0_client_id
   VITE_AUTH0_CLIENT_SECRET=your_auth0_client_secret
   ```

4. **Update CORS on Render**
   - Once you know your Netlify URL (e.g., `https://recordcrate.netlify.app`)
   - Update the `CORS_ORIGIN` environment variable in Render
   - Example: `https://recordcrate.netlify.app,https://deploy-preview-*--recordcrate.netlify.app`

5. **Update Auth0 Configuration**
   - In Auth0 Dashboard → Applications → Your App
   - Add Allowed Callback URLs: `https://your-app.netlify.app/callback`
   - Add Allowed Logout URLs: `https://your-app.netlify.app`
   - Add Allowed Web Origins: `https://your-app.netlify.app`

### Deploy Preview Support

Netlify automatically creates deploy previews for pull requests. To support this:

1. **Add wildcard CORS in Render**:
   ```
   CORS_ORIGIN=https://recordcrate.netlify.app,https://deploy-preview-*--recordcrate.netlify.app
   ```

2. **Add deploy preview URLs to Auth0** (optional for testing):
   - Pattern: `https://deploy-preview-[PR-NUMBER]--recordcrate.netlify.app`

---

## Deployment Workflow

### Automatic Deployments

Both services are configured for automatic deployment:

1. **Push to `main` branch**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Render** will:
   - Detect changes in `server/` directory
   - Run `npm install` in `server/`
   - Start the server with `npm start`
   - Health check at `/api/health`

3. **Netlify** will:
   - Detect changes
   - Run `npm run build` (TypeScript compile + Vite build)
   - Deploy to CDN
   - Available globally within seconds

### Manual Deployment

**Render:**
- Dashboard → Service → Manual Deploy → Deploy latest commit

**Netlify:**
- Dashboard → Deploys → Trigger deploy

---

## Monitoring & Troubleshooting

### Backend (Render)

**View Logs:**
- Render Dashboard → Service → Logs tab
- Shows real-time server logs, errors, and requests

**Common Issues:**

1. **Service sleeping (Free tier)**
   - Free tier spins down after 15 minutes of inactivity
   - First request takes 30-60 seconds to wake up
   - Solution: Upgrade to paid plan or use a ping service

2. **MongoDB connection timeout**
   - Check MongoDB Atlas IP allowlist
   - Verify `MONGODB_URI` is correct
   - Check Render logs for connection errors

3. **CORS errors**
   - Ensure Netlify URL is in `CORS_ORIGIN`
   - Must include `https://` protocol
   - Multiple origins separated by commas

### Frontend (Netlify)

**View Logs:**
- Netlify Dashboard → Deploys → [Deploy] → Deploy log

**Common Issues:**

1. **Build failures**
   - Check TypeScript errors in deploy log
   - Run `npm run build` locally first
   - Verify all dependencies in `package.json`

2. **Environment variables not working**
   - Must prefix with `VITE_` to be accessible in frontend
   - Redeploy after adding/changing variables
   - Check browser console for API URL

3. **API requests failing**
   - Verify `VITE_API_BASE_URL` is set correctly
   - Check browser Network tab for CORS errors
   - Ensure backend is running (not sleeping)

### Health Checks

**Backend:**
```bash
curl https://recordcrate-api.onrender.com/api/health
# Should return: {"status": "ok", ...}
```

**Frontend:**
```bash
curl -I https://recordcrate.netlify.app
# Should return: HTTP/2 200
```

---

## Performance Optimization

### Backend (Render)

1. **Keep-alive service** (Free tier workaround)
   - Use a service like [UptimeRobot](https://uptimerobot.com/) or [Cron-job.org](https://cron-job.org)
   - Ping `/api/health` every 5-10 minutes
   - Prevents service from sleeping

2. **Database connection pooling**
   - Already configured in Mongoose
   - Adjust pool size if needed in `index.js`

3. **Response caching**
   - Consider implementing Redis for frequently accessed data
   - Cache Spotify API responses

### Frontend (Netlify)

1. **Build optimization**
   - Vite automatically handles code splitting
   - Tree shaking for unused code
   - Asset optimization

2. **Headers & Caching**
   - Netlify automatically sets cache headers
   - CDN caching for static assets

3. **Performance monitoring**
   - Use Lighthouse in Chrome DevTools
   - Netlify Analytics (paid add-on)

---

## Cost Estimates

### Free Tier Limits

**Render Free Tier:**
- 750 hours/month
- Service spins down after 15 min inactivity
- 512 MB RAM
- Shared CPU
- **Cost: $0/month**

**Netlify Free Tier:**
- 100 GB bandwidth/month
- 300 build minutes/month
- Unlimited sites
- **Cost: $0/month**

**MongoDB Atlas Free Tier (M0):**
- 512 MB storage
- Shared RAM
- Shared vCPU
- **Cost: $0/month**

### Upgrade Recommendations

**Consider upgrading if:**
- Backend response time is critical (Render: $7/month for always-on)
- High traffic (>100K requests/month)
- Need more than 512 MB database storage (MongoDB: $9/month for M2)
- Deploy previews exceed 300 build minutes (Netlify: $19/month)

---

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use Render/Netlify dashboards for secrets
   - Rotate API keys regularly

2. **CORS Configuration**
   - Only allow specific domains
   - Avoid wildcard `*` in production

3. **MongoDB Security**
   - Use strong password
   - Limit IP access when possible
   - Enable audit logs (paid tier)

4. **Auth0 Configuration**
   - Only allow specific callback URLs
   - Enable MFA for admin accounts
   - Monitor Auth0 logs

---

## Quick Reference

### Service URLs

- **Frontend (Netlify)**: `https://recordcrate.netlify.app` (or your custom domain)
- **Backend (Render)**: `https://recordcrate-api.onrender.com`
- **MongoDB**: Connection via URI in environment variables

### Key Files

- `render.yaml` - Render infrastructure as code
- `netlify.toml` - Netlify build and redirect configuration
- `server/package.json` - Backend dependencies and scripts
- `package.json` - Frontend dependencies and scripts

### Important Commands

```bash
# Local development
npm run dev              # Frontend (Vite dev server)
cd server && npm run dev # Backend (with watch mode)

# Production builds
npm run build           # Frontend (creates dist/)
cd server && npm start  # Backend (production mode)

# Git deployment
git add .
git commit -m "Deploy changes"
git push origin main    # Triggers both Render and Netlify
```
