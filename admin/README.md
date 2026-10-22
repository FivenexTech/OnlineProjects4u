# OnlineProjects4U Admin

Deploy this directory as a separate Vercel project:

- Root directory: `admin/`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- Production environment variable: `VITE_API_BASE_URL` set to the deployed HTTPS backend URL

The checked-in [`.env.production.example`](./.env.production.example) uses
`https://api.onlineprojects4u.in` as the production API hostname. Change it if
the backend is deployed at a different hostname; do not put credentials in
frontend environment variables.

The Payments screen is intentionally limited to verified Razorpay payments.
Reviews, Reports & Analytics, Audit Logs, and Platform Settings remain planned:
the current backend has no review model/workflow or dedicated reporting,
audit-log query, or settings APIs for those modules.
