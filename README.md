# RecordCrate

React + TypeScript + Vite frontend with an Express + MongoDB backend.

Frontend lives at the repo root; backend is in `server/`.

## Quickstart (local)

Frontend

```powershell
npm install
npm run dev
```

Backend

```powershell
cd server
cp .env.example .env
# Edit .env: set MONGODB_URI, PORT=4000, CORS_ORIGIN=http://localhost:5173
npm install
npm run dev
```

Optional: set the frontend API base URL for local dev

```powershell
$env:VITE_API_BASE_URL="http://localhost:4000"
```

## Production

The frontend can be deployed to Netlify (already configured for SPA routing via `public/_redirects`).

Set the following Netlify environment variables:

- `VITE_SPOTIFY_CLIENT_ID`
- `VITE_SPOTIFY_CLIENT_SECRET`
- `VITE_SPOTIFY_REDIRECT_URI` (e.g., `https://<site>/callback`)
- `VITE_API_BASE_URL` (point to the backend URL)

### Backend on AWS App Runner (recommended)

See `server/README.md` for step-by-step instructions. High level:

1. Build and push the Docker image for `server/` to ECR.
2. Create an App Runner service from that image.
3. Configure env vars: `MONGODB_URI`, `PORT=4000`, `CORS_ORIGIN=https://<your-frontend-domain>`.
4. Use the App Runner HTTPS URL for `VITE_API_BASE_URL` in the frontend.

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-apprunner.yml` that can:
- Build and push the `server/` image to ECR on push to `main`
- Update your App Runner service image

Required GitHub secrets:

- `AWS_ROLE_ARN`: OIDC-enabled IAM role the workflow can assume
- `AWS_APPRUNNER_ACCESS_ROLE_ARN`: App Runner ECR access role (or use an existing service access role)

You can adjust region, repo name, and service name inside the workflow file.

Alternatively, you can configure App Runner to build directly from this GitHub repository (no separate ECR required):

- Source directory (monorepo): `server/`
- Runtime: Node.js 20
- Build command: `npm ci`
- Start command: `npm start`
- Port: `4000`, Health check: `/api/health`
- Env vars: `MONGODB_URI`, `PORT=4000`, `CORS_ORIGIN=https://<your-frontend-domain>`
- Enable auto deploy from `main` for hands-free updates

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
