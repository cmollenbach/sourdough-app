# Quick Deploy Guide

## 🚀 Fastest Way to Deploy

### 1. Backend (Render) - 2 minutes
1. Go to: https://dashboard.render.com
2. Click your backend service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait 2-5 minutes
5. Copy backend URL (e.g., `https://sourdough-backend.onrender.com`)

### 2. Frontend (Netlify) - 2 minutes
1. Go to: https://app.netlify.com
2. Click your site
3. Click "Deploys" → "Trigger deploy" → "Deploy site"
4. Go to Site settings → Environment variables
5. Add: `VITE_API_BASE_URL` = `https://your-backend.onrender.com/api`
6. Wait 1-3 minutes

### 3. Test - 1 minute
1. Visit your Netlify URL
2. Open DevTools (F12)
3. Check console for errors
4. Test login/register
5. Done! ✅

## ✅ What's Already Done

- ✅ Build successful
- ✅ All fixes implemented
- ✅ Configuration ready
- ✅ Documentation complete

## 🧪 Quick Test

After deployment:
1. Visit deployed frontend
2. Try to login with wrong credentials
3. **Expected**: Clear error message (not generic)
4. Stop backend (if you can)
5. **Expected**: Red offline banner appears

---

**Total Time**: ~5 minutes
**Status**: Ready to deploy!

