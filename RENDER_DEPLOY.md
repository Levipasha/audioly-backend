# Deploying to Render

The app is TypeScript and must be **compiled** before the start command runs.

## Fix: Build Command

In **Render Dashboard** → your service → **Settings** → **Build & Deploy**:

- **Build Command:** `npm install && npm run build`
- **Start Command:** `node dist/server.js`

If you only run `npm install`, the `dist/` folder is never created and you get:

```
Error: Cannot find module '/opt/render/project/src/dist/server.js'
```

`npm run build` runs `tsc` and outputs `dist/server.js`.

## Environment variables

Set in Render → Environment:

- `PORT` (Render sets this automatically for web services)
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (optional, default 15m)
- `REFRESH_JWT_SECRET` (required for `/auth/refresh`)
- `REFRESH_JWT_EXPIRES_IN` (optional, default 30d)
- Cloudinary etc. as needed
