# Deployment Guide

## Quick Deploy

### Automatic Deployment (Recommended)
1. Push to GitHub `main` branch
2. Netlify and Render automatically deploy
3. Monitor dashboards for completion (2-5 minutes)

### Manual Deployment

#### Backend (Render)
1. Go to https://dashboard.render.com
2. Select backend service
3. Click "Manual Deploy" → "Deploy latest commit"

#### Frontend (Netlify)
1. Go to https://app.netlify.com
2. Select site
3. Click "Deploys" → "Trigger deploy"
4. Set environment variable: `VITE_API_BASE_URL` = your backend URL + `/api`

## Environment Variables

### Frontend (Netlify)
- `VITE_API_BASE_URL` - Backend API URL (e.g., `https://your-backend.onrender.com/api`)

### Backend (Render)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS
- `CORS_ORIGINS` - Additional allowed origins

## Testing After Deployment

1. Visit deployed frontend URL
2. Open DevTools (F12)
3. Test offline banner (disable network)
4. Test error messages (invalid login)
5. Verify navigation is always visible
6. Check console for errors

## Troubleshooting

- **Backend won't deploy**: Check Render logs, verify environment variables
- **Frontend won't deploy**: Check Netlify logs, verify build command
- **Tests fail**: Verify backend accessible, check CORS settings

