# OnlineProjects4U API

## Setup on Windows PowerShell

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

Before `npm run dev`, set `MONGODB_URI` and replace the `JWT_SECRET` placeholder with a long random value in `.env`. Never commit `.env` or credentials. The API does not start unless MongoDB connection initialization succeeds.

## MongoDB Atlas

1. Sign in to MongoDB Atlas and create a free development project and cluster.
2. In **Database Access**, create a database user with a dedicated username and password. Use the minimum database permissions needed for this development database.
3. In **Network Access**, add the IP address of the machine running the API. Avoid `0.0.0.0/0` except for a temporary, isolated experiment.
4. Select **Connect > Drivers**, choose Node.js, and copy the SRV connection string.
5. Replace the username, password, and database name in the local `MONGODB_URI`. URL-encode reserved characters in the database password. Keep this value only in `.env`.
6. Run `npm run dev`, then check `GET http://localhost:4000/api/health` and `GET http://localhost:4000/api/health/ready`.

Do not send database credentials, connection strings, or passwords in chat or commit them to the repository.

## Environment variables

- `NODE_ENV`: `development`, `test`, or `production`.
- `PORT`: local API port, default `4000`.
- `CLIENT_ORIGIN`: exact frontend origin allowed by CORS.
- `MONGODB_URI`: required Mongoose connection string.
- `JWT_SECRET`: required secret with at least 32 characters.
- `JWT_EXPIRES_IN`: bearer token lifetime, default `15m`.
- `PASSWORD_RESET_URL`: frontend reset route placeholder.
- `RAZORPAY_*` and `PRIVATE_STORAGE_BUCKET`: reserved placeholders, unused in Stage B.

## Commands

- `npm run dev` starts the TypeScript API with watch mode.
- `npm run build` compiles `src/` to `dist/`.
- `npm test` runs the Vitest API tests.
- `npm run lint` runs the TypeScript no-emit check.

## API foundation

- `GET /api/health` is public liveness and does not claim that MongoDB is ready.
- `GET /api/health/ready` is public readiness and returns `503` until MongoDB is connected.
- `/api/auth` contains validated registration/login boundaries and bearer-token account access.
- `/api/projects` contains public catalogue reads and admin-protected creation.
- `/api/support` requires an authenticated student/admin.
- `/api/admin` requires an authenticated admin role on every route.
- Commerce, payment, purchase-library, and download routes are deliberately `501 NOT_CONFIGURED` until real provider/storage integrations are implemented.

## Common connection errors

- `MONGODB_URI is required` or `JWT_SECRET must be at least 32 characters`: `.env` is missing or still contains an invalid placeholder. The API intentionally refuses to start.
- `querySrv ENOTFOUND`: check the Atlas SRV hostname and that the connection string was copied completely.
- `Authentication failed`: verify the Atlas database username/password and URL-encode special password characters.
- `IP ... is not allowed`: add the current machine IP in Atlas **Network Access**.
- `Server selection timed out`: confirm the cluster is running, the URI is correct, and network access allows this machine.
- `GET /api/health` succeeds but `/api/health/ready` returns `503`: the process is reachable, but MongoDB is not connected yet.