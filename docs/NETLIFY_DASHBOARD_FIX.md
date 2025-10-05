# 🔧 Netlify Dashboard Configuration Fix

**Issue:** Netlify is ignoring `netlify.toml` and using old cached settings from the dashboard.

## ⚠️ Current Problem

The error logs show Netlify is using:
```
base: /opt/build/repo/frontend          ← WRONG (should be root)
command: npm run build                   ← WRONG (should be our custom command)
NODE_VERSION: 18.20.8                    ← WRONG (should be 20.18.1)
```

Even though our `netlify.toml` specifies:
```toml
[build]
  command = "npm install --include=optional && npm run build:frontend"
  publish = "frontend/dist"

[build.environment]
  NODE_VERSION = "20.18.1"
```

## 🎯 Solution: Clear Dashboard Settings

Netlify uses this priority order:
1. **Dashboard UI settings** ← Currently overriding everything!
2. `netlify.toml` file ← Our correct config
3. Auto-detection

We need to **clear the dashboard settings** so `netlify.toml` takes precedence.

---

## 📋 Step-by-Step Instructions

### 1. Go to Netlify Site Settings

1. Log in to https://app.netlify.com
2. Select your site (likely "loafly" or "sourdough-app")
3. Click **"Site settings"** in the top navigation

### 2. Navigate to Build Settings

1. In the left sidebar, click **"Build & deploy"**
2. Click **"Build settings"**

### 3. Clear Build Settings

You'll see a section called **"Build settings"** with these fields:

#### Base Directory
- **Current:** `frontend` ← Delete this!
- **Change to:** Leave **EMPTY** (blank)
- This lets `netlify.toml` control the base

#### Build Command
- **Current:** `npm run build` ← Delete this!
- **Change to:** Leave **EMPTY** (blank)
- This lets `netlify.toml` specify the command

#### Publish Directory
- **Current:** `dist` or `frontend/dist`
- **Change to:** Leave **EMPTY** (blank)
- This lets `netlify.toml` specify the publish path

Click **"Save"** after clearing these fields.

### 4. Clear Environment Variables (If Needed)

1. Still in "Build & deploy" section
2. Click **"Environment variables"** in left sidebar
3. If you see `NODE_VERSION` set to `18` or anything else:
   - Click the `...` menu next to it
   - Click **"Delete"**
   - Click **"Save"**

Our `.nvmrc` file will handle this.

### 5. Clear Build Cache

1. Go to **"Site settings"** > **"Build & deploy"** > **"Build settings"**
2. Scroll down to **"Build image selection"**
3. Click **"Clear cache and retry deploy"** button

This forces Netlify to:
- Re-download Node 20 (not cached 18)
- Re-install dependencies with optional deps
- Use fresh `netlify.toml` settings

---

## ✅ Expected Result

After clearing settings and triggering a new deploy, you should see:

```
✅ Using Node v20.18.1 (from .nvmrc)
✅ npm workspaces detected
✅ Running: npm install --include=optional && npm run build:frontend
✅ Installing @rollup/rollup-linux-x64-gnu
✅ Building shared package
✅ Building frontend
✅ Publishing to frontend/dist
✅ Deploy successful!
```

---

## 🚀 Alternative: Deploy Using UI

If you prefer to keep dashboard settings, update them to match `netlify.toml`:

### Base Directory:
```
(leave empty - build from repo root)
```

### Build Command:
```
npm install --include=optional && npm run build:frontend
```

### Publish Directory:
```
frontend/dist
```

### Environment Variables:
```
NODE_VERSION = 20.18.1
```

But **clearing** them is better - lets `netlify.toml` be the source of truth!

---

## 📝 Verification

After making changes, trigger a new deploy:

1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** > **"Clear cache and deploy site"**
3. Watch the build logs
4. Look for:
   - `Now using node v20.x.x` (not v18.x.x)
   - `npm install --include=optional` in build command
   - No `Cannot find module @rollup/rollup-linux-x64-gnu` error

---

## 🆘 If Still Failing

If the build still fails after clearing settings:

### Option 1: Delete and Re-add Site
1. Delete the site from Netlify dashboard
2. Re-add it from GitHub repo
3. **Don't** configure any build settings
4. Let it auto-detect from `netlify.toml`

### Option 2: Use Netlify CLI
```powershell
# Deploy directly from CLI (bypasses dashboard settings)
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### Option 3: Contact Support
If Netlify dashboard is truly ignoring `netlify.toml`, there may be a bug.
File a support ticket at: https://answers.netlify.com/

---

## 📚 Resources

- [Netlify Build Settings Priority](https://docs.netlify.com/configure-builds/file-based-configuration/#precedence)
- [Netlify TOML Reference](https://docs.netlify.com/configure-builds/file-based-configuration/)
- [Node Version Management](https://docs.netlify.com/configure-builds/manage-dependencies/#node-js-and-javascript)

---

**Last Updated:** October 5, 2025  
**Status:** Awaiting manual dashboard configuration
