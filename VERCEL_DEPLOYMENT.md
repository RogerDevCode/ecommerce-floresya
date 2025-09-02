# 🚀 Deployment Instructions for Vercel

## Critical Fix Applied

✅ **Problem Solved**: The original deployment was failing because:
1. Vercel serverless functions can't use SQLite (no persistent filesystem)
2. Missing environment variables for Supabase connection
3. Incorrect API routing configuration

## Files Modified/Created

1. **`api/index.js`** - New serverless API endpoint for Vercel
2. **`vercel.json`** - Updated routing configuration
3. **`frontend/images/hero-flowers.jpg`** - Added missing hero image
4. **`.env.example`** - Environment variables template

## Required Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

### Essential (Required for API to work):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

### Optional (Recommended):
```
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SQL_LOGGING=false
```

## Database Setup (Supabase)

1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key from Settings → API
3. Run the database schema from `database/schema_postgres.sql`
4. Load seed data from `database/seed_data_postgres.sql`

## Deployment Steps

1. **Update Environment Variables in Vercel**:
   - Add the required variables above
   
2. **Redeploy**:
   ```bash
   # If using Vercel CLI
   vercel --prod
   
   # Or push to main branch (if connected to Git)
   git push origin main
   ```

3. **Test the deployment**:
   - Visit: `https://your-project.vercel.app/api/health`
   - Should return: `{"success": true, "message": "API funcionando correctamente"}`

## What Was Fixed

### API Structure
- Created dedicated serverless API at `/api/index.js`
- Moved from Express server to Vercel-compatible serverless function
- Updated CORS to include Vercel domain

### Database Connection
- Fixed database initialization for serverless environment
- Added lazy initialization (only connects when needed)
- Proper error handling for connection failures

### Static Files
- Fixed missing hero image (404 error)
- Updated routing for static assets

## Troubleshooting

### If API still returns 500 errors:
1. Check Vercel function logs in dashboard
2. Verify all environment variables are set
3. Ensure Supabase database is accessible
4. Check API endpoint: `/api/health` first

### If images don't load:
- Static files should work now with updated routing
- Check network tab for actual 404s vs CORS issues

## Next Steps After Deployment

1. Test all API endpoints work
2. Verify admin panel functionality
3. Test payment flow
4. Check responsive design on mobile
5. Configure custom domain (optional)

---

**Status**: ✅ Ready for deployment  
**Last Updated**: 2025-09-02