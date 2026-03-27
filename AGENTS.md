# Live Production Portals

- **Manufacturer Portal**: [https://fablota-manufacturer.vercel.app](https://fablota-manufacturer.vercel.app)
- **Retailer Portal**: [https://fablota-retailer.vercel.app](https://fablota-retailer.vercel.app)
- **Super Admin Portal**: [https://fablota-admin.vercel.app](https://fablota-admin.vercel.app)
- **Backend API (Render)**: [https://fablota-new.onrender.com](https://fablota-new.onrender.com)

# Vercel Deployment Best Practices (Vite + React)

When deploying Single Page Applications (SPAs) like React with Vite to Vercel, there are several key configurations required to ensure smooth performance, security, and proper routing.

## 1. Client-Side Routing (SPA Catch-all)
React Router handles navigation dynamically on the client side. If a user refreshes a page on Vercel at a specific nested path (e.g. `/dashboard/settings`), Vercel will attempt to find a `settings.html` file and return a **404 Not Found** error. 

To fix this, you must tell Vercel to route all traffic back to `index.html` by including a `vercel.json` file at the root of your deployment folder:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 2. Environment Variable Security
- **Public Variables**: Any environment variable prefixed with `VITE_` (e.g., `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) will be exposed to the browser. This is safe and necessary for your frontend client config.
- **Private Variables**: Never prefix secret keys (like database passwords or Supabase Service Role Keys) with `VITE_`. They should only be accessed via secure backend API routes or Serverless Edge Functions (`process.env.SECRET_KEY`).
- Always configure these variables directly in the **Vercel Dashboard -> Settings -> Environment Variables** rather than saving `.env` files to GitHub.

## 3. Strict Build Validations
By default, Vite only bundles your application but skips type-checking, which can lead to runtime crashes in production.
- Update your build script in `package.json` to validate TypeScript before building: `"build": "tsc && vite build"`.
- If a build fails on Vercel but works locally, always ensure your local folder names and import casing match precisely (e.g. importing from `./Components` when the folder is actually `./components`). Windows is case-insensitive, but Vercel operates on Linux and will fail.

## 4. Multi-App (Monorepo) Architecture Deployments
For projects containing multiple standalone portals (e.g., Manufacturer, Retailer, Super Admin):
- Create **three distinct separate projects** inside your Vercel dashboard, all connected to the exact same GitHub repository.
- In each project’s settings, define custom **Root Directory** configurations, or override the **Build Command** to build the specific portal (e.g. `npm run build:admin`), and set the **Output Directory** to its respective output folder (e.g. `dist-admin`).

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
