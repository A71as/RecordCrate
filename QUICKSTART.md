# RecordCrate - Quick Start Guide

## 🚀 Quick Deploy Checklist

### 1. Backend (Render) - First Time Setup

1. **Create Render Account**: [render.com](https://render.com)

2. **Create New Web Service**:
   - Click "New +" → "Blueprint"
   - Connect GitHub repo: `A71as/RecordCrate`
   - Render auto-detects `render.yaml`

3. **Add Environment Variables** in Render Dashboard:
   ```
   MONGODB_URI=<your-mongodb-connection-string>
   CORS_ORIGIN=https://your-app.netlify.app
   SPOTIFY_CLIENT_ID=<your-id>
   SPOTIFY_CLIENT_SECRET=<your-secret>
   AUTH0_DOMAIN=<your-domain>.auth0.com
   AUTH0_CLIENT_ID=<your-auth0-id>
   AUTH0_CLIENT_SECRET=<your-auth0-secret>
   GEMINI_API_KEY=<your-gemini-key>
   ```

4. **Configure MongoDB Atlas**:
   - Network Access → Add IP Address → "Allow from Anywhere" (0.0.0.0/0)

5. **Deploy**: Render auto-deploys on `git push`

**Your API will be at**: `https://recordcrate-api.onrender.com`

---

### 2. Frontend (Netlify)

1. **Create Netlify Account**: [netlify.com](https://www.netlify.com)

2. **Import Project**:
   - "Add new site" → "Import an existing project"
   - Connect GitHub: `A71as/RecordCrate`
   - Build settings auto-detected from `netlify.toml`

3. **Add Environment Variables** in Netlify Dashboard:
   ```
   VITE_API_BASE_URL=https://recordcrate-api.onrender.com
   VITE_SPOTIFY_CLIENT_ID=<your-id>
   VITE_SPOTIFY_CLIENT_SECRET=<your-secret>
   VITE_SPOTIFY_REDIRECT_URI=https://your-app.netlify.app/callback
   VITE_AUTH0_DOMAIN=<your-domain>.auth0.com
   VITE_AUTH0_CLIENT_ID=<your-auth0-id>
   VITE_AUTH0_CLIENT_SECRET=<your-auth0-secret>
   ```

4. **Update CORS**: Go back to Render and update `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://your-actual-app.netlify.app,https://deploy-preview-*--your-actual-app.netlify.app
   ```

5. **Configure Auth0**:
   - Allowed Callback URLs: `https://your-app.netlify.app/callback`
   - Allowed Logout URLs: `https://your-app.netlify.app`
   - Allowed Web Origins: `https://your-app.netlify.app`

6. **Deploy**: Netlify auto-deploys on `git push`

**Your app will be at**: `https://your-app.netlify.app`

---

## ✅ Verify Deployment

### Backend Health Check
```bash
curl https://recordcrate-api.onrender.com/api/health
```
Should return:
```json
{
  "uptime": 123.45,
  "status": "ok",
  "service": "recordcrate-api",
  "timestamp": "2025-12-05T...",
  "mongodb": "connected",
  "environment": "production"
}
```

### Frontend Check
```bash
curl -I https://your-app.netlify.app
```
Should return: `HTTP/2 200`

---

## 🔄 Daily Workflow

### Making Changes

```bash
# Make your code changes
git add .
git commit -m "Your changes"
git push origin main
```

**What happens:**
- ✅ Render automatically rebuilds and redeploys backend
- ✅ Netlify automatically rebuilds and redeploys frontend
- ⏱️ Typically takes 2-5 minutes total

### View Logs

**Render Logs:**
- Dashboard → recordcrate-api → Logs tab

**Netlify Logs:**
- Dashboard → Deploys → Click on deployment → Deploy log

---

## 🐛 Common Issues

### 1. Backend sleeping (Free tier)
**Issue**: First request takes 30+ seconds
**Solution**: 
- Wait for wake-up OR
- Upgrade to paid plan ($7/mo) OR
- Use UptimeRobot to ping every 5 minutes

### 2. CORS errors
**Issue**: Frontend can't reach backend
**Fix**:
1. Check `CORS_ORIGIN` in Render matches Netlify URL exactly
2. Include `https://` in URL
3. Redeploy backend after changing

### 3. MongoDB connection failed
**Issue**: Backend can't connect to database
**Fix**:
1. Check MongoDB Atlas → Network Access
2. Ensure 0.0.0.0/0 is allowed
3. Verify `MONGODB_URI` is correct in Render

### 4. Build failed on Netlify
**Issue**: TypeScript errors or build errors
**Fix**:
1. Test locally: `npm run build`
2. Fix errors
3. Push again

### 5. Environment variables not working
**Issue**: Frontend shows "undefined"
**Fix**:
1. Verify variables start with `VITE_`
2. Redeploy after adding variables
3. Check browser console for values

---

## 💰 Free Tier Limits

| Service | Free Tier Limit |
|---------|----------------|
| **Render** | 750 hrs/mo, 512 MB RAM, sleeps after 15 min |
| **Netlify** | 100 GB bandwidth/mo, 300 build mins/mo |
| **MongoDB Atlas** | 512 MB storage, shared cluster |
| **Auth0** | 7,000 active users |

**Upgrade when needed:**
- Render: $7/mo for always-on
- Netlify: $19/mo for more bandwidth
- MongoDB: $9/mo for 2GB (M2)

---

## 📚 More Help

See `DEPLOYMENT.md` for comprehensive documentation including:
- Detailed setup instructions
- Performance optimization
- Security best practices
- Monitoring and troubleshooting
- Cost estimates

---

## 🎉 You're Done!

Your full-stack app is now deployed and will auto-update on every push to `main`!

**Next steps:**
1. Share your app URL
2. Monitor usage in dashboards
3. Set up custom domain (optional)
4. Enable analytics (optional)
