# OnlineProjects4U

OnlineProjects4U is an educational software project-kit platform for college students. The repository contains the existing React storefront and a separate TypeScript API foundation.

## Repository layout

- `client/` React + Vite + TypeScript storefront with the existing dark Spatial UI.
- `admin/` independent React + Vite + TypeScript admin dashboard. It uses the shared API and can be deployed separately from the storefront.
- `server/` Express + TypeScript API with Mongoose models, authentication boundaries, validation, authorization middleware, and health/test coverage.
- `ARCHITECTURE.md` current boundaries, security rules, and staged delivery plan.

## Local setup

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

```bash
Set-Location server
npm ci
Copy-Item .env.example .env
notepad .env
npm run lint
npm run build
npm test
npm run dev
```

The API listens on `http://localhost:4000` by default. Check `GET http://localhost:4000/api/health`. MongoDB is required for registration, project persistence, and other database-backed operations; the health endpoint works without a live database connection.

### Independent admin dashboard

```powershell
Set-Location admin
npm install
Copy-Item .env.example .env.local
npm run dev
```

The admin app runs on `http://localhost:5174` and reads `VITE_API_BASE_URL` from `admin/.env.local`. It shares the backend session cookie and never connects directly to MongoDB. The backend accepts this origin through `ADMIN_ORIGIN` (default `http://localhost:5174`).

For an independent Vercel project, set the project root to `admin/`, use `npm install` as the install command, `npm run build` as the build command, and `dist` as the output directory. Set `VITE_API_BASE_URL` to the HTTPS backend URL. For the planned `admin.onlineprojects4u.in` domain, add the domain in Vercel and configure `ADMIN_ORIGIN=https://admin.onlineprojects4u.in` in the backend environment. Do not change DNS or deploy automatically from this repository.

## Validation

```bash
cd client && npm run build && npm run lint
cd ../server && npm run build && npm test
```

## Important placeholders

Razorpay verification, private object storage, protected download signing, reviews, notifications, content management, reports, audit-log UI, permissions, and platform settings require additional provider/models work and remain visibly unavailable in the admin navigation. The live admin modules use protected shared APIs for overview, projects, users, orders, coupons, and support tickets. Project files must remain outside `client/public`, source control, and public URLs.