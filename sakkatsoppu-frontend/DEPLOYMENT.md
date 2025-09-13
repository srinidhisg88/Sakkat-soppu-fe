# Deploying to Vercel (Vite + React)

## 1) Project settings on Vercel
- Framework preset: Other (or Vite).
- Build command: `npm run build`
- Output directory: `dist`

## 2) Environment variables
Set these in Vercel Project → Settings → Environment Variables:
- `VITE_API_URL` → https://your-api.example.com/api

Notes:
- `VITE_` prefix is required for Vite to expose envs to the browser.
- If you don’t set this, the app will fallback to `/api` (useful if you connect Vercel to a backend via rewrites or same domain).

## 3) vercel.json
We include a `vercel.json` with SPA-friendly routes:
- Serve static assets directly
- Fallback all unmatched routes to `index.html` so React Router works client-side

```
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/static-build" }
  ],
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "routes": [
    { "src": "/(.*)\\.(js|css|png|jpg|jpeg|gif|svg|ico|json|txt|woff|woff2|ttf)", "dest": "/$1.$2" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
```

## 4) Local test (optional)
- Build locally: `npm run build`
- Preview locally: `npm run preview` → open the provided URL and test client-side routes.

## 5) Deploy
- Push to the `main` branch (if connected) or use `vercel --prod` from this folder.

## 6) Backend CORS & cookies
- API must allow CORS from your Vercel domain and set cookies with `SameSite=None; Secure` if you rely on cookies.
- Our axios client uses `withCredentials: true` and Bearer tokens when needed. Ensure tokens/cookies work in production.
