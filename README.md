# OnlineProjects4U

OnlineProjects4U is an educational software project-kit platform for college students. The repository contains the existing React storefront and a separate TypeScript API foundation.

## Repository layout

- `client/` React + Vite + TypeScript storefront with the existing dark Spatial UI.
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

## Validation

```bash
cd client && npm run build && npm run lint
cd ../server && npm run build && npm test
```

## Important placeholders

Payment processing, password reset delivery, email verification delivery, private object storage, protected downloads, and admin CRUD workflows are intentionally not marked as live. Configure real credentials and providers before enabling them. Project files must remain outside `client/public`, source control, and public URLs.