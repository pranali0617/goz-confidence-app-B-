# Deploying Goz

## Recommended target

Use Vercel. This app needs:

- a static frontend build from Vite
- a server-side `/api/chat` endpoint so the API key stays private

## Before deploy

Set these environment variables in Vercel Project Settings:

- `GROQ_API_KEY`
- `GROQ_MODEL`

Suggested model:

```env
GROQ_MODEL=llama-3.1-8b-instant
```

## Deploy steps

1. Push this project to GitHub.
2. Import the repository into Vercel.
3. Keep the detected framework as `Vite`.
4. Add the environment variables in the Vercel dashboard.
5. Deploy.

## Local development

Continue using:

```bash
npm run dev
```

The app uses Vite middleware locally and `api/chat.js` when deployed on Vercel.
