# Asteroids Game - Redis Leaderboard Setup

## Redis Setup for Vercel

This project uses Redis to store the global leaderboard. You have two options:

### Option 1: Upstash Redis (Recommended for Vercel - Free Tier)

1. Go to [Upstash](https://upstash.com/)
2. Sign up/Login
3. Create a new Redis database
4. Copy the `REDIS_URL` connection string
5. Add to Vercel:
   - Go to your project settings on Vercel
   - Navigate to Environment Variables
   - Add: `REDIS_URL` = `redis://...` (your connection string)

### Option 2: Redis Cloud

1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Create a free database
3. Get connection string
4. Add `REDIS_URL` to Vercel environment variables

### Option 3: Local Redis (Development Only)

```bash
# Install Redis locally
# Windows: https://redis.io/docs/getting-started/installation/install-redis-on-windows/
# Mac: brew install redis
# Linux: sudo apt-get install redis-server

# Start Redis
redis-server

# Your REDIS_URL will be: redis://localhost:6379
```

## Local Development with API

Vite (via `npm run dev`) only hosts the frontend. To test the Redis API (`/api/leaderboard.js`) locally, you must use the **Vercel CLI**.

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Run with Vercel Dev
Instead of `npm run dev`, run:
```bash
vercel dev
```
This will start a local server (usually at `http://localhost:3000`) that correctly resolves both your React app and the `/api` serverless functions.

### 3. Environment Variables
Ensure your `.env` or `.env.local` file contains:
```
REDIS_URL=redis://your-redis-connection-string
```
Vercel Dev will automatically load these variables.

## Deployment

```bash
vercel --prod
```

## How It Works

- `GET /api/leaderboard` - Fetches top 20 scores
- `POST /api/leaderboard` - Submits a new score (automatically updates top 20)

The leaderboard is shared across all users globally and persists in Redis!
