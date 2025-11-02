# RecordCrate API (Express + MongoDB)

This is the backend API for RecordCrate, built with Express and Mongoose.
It stores user profiles and album reviews (including base/adjusted ratings, score modifiers, per-track ratings, and writeups).

## Local development

Prereqs:
- Node.js 18+
- A MongoDB connection string (Atlas or local)

1. Copy env and fill values

```
cp .env.example .env
# Edit .env -> set MONGODB_URI, PORT (e.g. 4000), CORS_ORIGIN (your frontend origin)
```

2. Install and run

```
npm install
npm run dev
```

The API will start on `http://localhost:4000` by default.

Health check:
- GET `http://localhost:4000/api/health`

## Environment variables

- `MONGODB_URI` (required): MongoDB connection string
- `PORT` (optional): Port to listen on (default 4000)
- `CORS_ORIGIN` (optional): Allowed origin for CORS (default `http://localhost:5173`)

## Frontend configuration

In the frontend (Vite), set `VITE_API_BASE_URL` to the backend base URL.

- Local development: `VITE_API_BASE_URL=http://localhost:4000`
- Production (Netlify, etc.): set the env var to your deployed API URL

## API overview

- `POST /api/users/sync` — upsert a user by Spotify ID
- `GET /api/users/:spotifyId` — fetch a user profile
- `POST /api/reviews` — upsert a review for a user+album
- `GET /api/reviews/album/:albumId` — list reviews for an album
- `GET /api/reviews/user/:spotifyId` — list reviews by a user, optional `?albumId=`
- `GET /api/reviews` — recent reviews feed

## Deploying to AWS (options)

You can run the Express server on AWS a few different ways.

### Option A: Elastic Beanstalk (Node platform)

Simplest way to lift-and-shift the Node app.

1. Install and configure AWS CLI
2. From `server/`, initialize and deploy:

```
# one-time
aws elasticbeanstalk create-application --application-name recordcrate-api

# create environment (replace values accordingly)
aws elasticbeanstalk create-environment \
  --application-name recordcrate-api \
  --environment-name recordcrate-api-env \
  --solution-stack-name "64bit Amazon Linux 2023 v4.0.6 running Node.js 20" \
  --option-settings Namespace=aws:elasticbeanstalk:container:nodejs,OptionName=NodeVersion,Value=20

# deploy via EB CLI (optional, recommended)
# eb init
# eb use recordcrate-api-env
# eb deploy
```

3. Configure environment variables in Elastic Beanstalk console:
   - MONGODB_URI
   - PORT (4000)
   - CORS_ORIGIN (your frontend URL)

The app will serve from the EB environment URL; use that for `VITE_API_BASE_URL`.

### Option B: AWS App Runner (recommended)

App Runner runs your container directly with HTTPS and autoscaling out of the box, minimal ops.

1) Create an ECR repository (one-time).

2) Build and push the image:

```
docker build -t recordcrate-api:latest .
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
docker tag recordcrate-api:latest <account-id>.dkr.ecr.<region>.amazonaws.com/recordcrate-api:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/recordcrate-api:latest
```

3) Create an App Runner service from that ECR image.
  - Runtime: Container
  - Port: 4000
  - Health check path: `/api/health`
  - Env vars: `MONGODB_URI`, `PORT=4000`, `CORS_ORIGIN=https://<your-frontend-domain>`
  - Auto scaling: default is fine to start; you can tune later.

4) After it’s healthy, point your frontend `VITE_API_BASE_URL` to the App Runner HTTPS URL. Optionally, add a custom domain in App Runner.

### App Runner without creating your own ECR (build from GitHub)

You can also connect App Runner directly to this GitHub repo and let it build from source (no manual ECR repo needed). App Runner creates/manages an internal ECR behind the scenes.

- Source repository: connect your GitHub account and select this repo/branch
- Source directory (monorepo): `server/`
- Build configuration: App Runner
  - Runtime: Node.js 20
  - Build command: `npm ci`
  - Start command: `npm start`
  - Port: `4000`
  - Health check path: `/api/health`
- Environment variables:
  - `MONGODB_URI` = your Atlas connection string
  - `PORT` = `4000`
  - `CORS_ORIGIN` = your frontend origin (e.g., `https://<your-site>`)
- Auto deploy: enable so pushes to `main` redeploy automatically

### Option C: ECS Fargate (containerized)

Build and push a Docker image, then run it on Fargate.

1. Build the image locally:

```
docker build -t recordcrate-api:latest .
```

2. Tag and push to ECR, then create an ECS service (Fargate) with port 4000 and your env vars. Attach an ALB for public access. Point `VITE_API_BASE_URL` to the ALB URL.

### Option D: Lambda + API Gateway (serverless)

If you prefer serverless, you can adapt the Express app using `serverless-http` and deploy with SAM/Serverless Framework.

High level changes (not yet applied):
- Export the Express `app` separately and add a Lambda handler (e.g., `lambda.js`) using `serverless-http`.
- Provision a MongoDB Atlas cluster and set `MONGODB_URI` as Lambda env var.
- Deploy with AWS SAM or Serverless Framework and map API Gateway to the Lambda handler.

Example handler:

```js
import serverless from 'serverless-http'
import { app, connectDb } from './app.js' // refactor to export app without listening

let isConnected = false
export const handler = async (event, context) => {
  if (!isConnected) {
    await connectDb()
    isConnected = true
  }
  return serverless(app)(event, context)
}
```

If you want this route, I can refactor the code and add the necessary files.

## Security & CORS

- CORS is restricted via `CORS_ORIGIN`. Set this to your frontend origin(s).
- For production, consider a WAF/ALB or API Gateway in front of the service.

## Monitoring

- Add structured logging, metrics, and health checks. On AWS, consider CloudWatch Logs.
