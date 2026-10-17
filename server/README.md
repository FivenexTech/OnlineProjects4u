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
- `MONGODB_DNS_SERVERS`: optional comma-separated DNS servers used by Node's SRV resolver. On Windows, the app defaults to `8.8.8.8,8.8.4.4` for the Atlas `mongodb+srv` resolver issue diagnosed here. Override it for a corporate/VPN DNS server or set it empty to use the platform default.
- `JWT_SECRET`: required secret with at least 32 characters.
- `JWT_EXPIRES_IN`: bearer token lifetime, default `15m`.
- `PASSWORD_RESET_URL`: frontend reset route placeholder.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`: Google Cloud OAuth placeholders. The server verifies Google ID tokens against the configured client ID.
- `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_PROVIDER_API_KEY`: email OTP provider configuration. `console` intentionally returns configuration-required for OTP delivery; it does not print or fake an OTP.
- `RAZORPAY_*` and `PRIVATE_STORAGE_BUCKET`: reserved placeholders, unused in this stage.

## Commands

- `npm run dev` starts the TypeScript API with watch mode.
- `npm run build` compiles `src/` to `dist/`.
- `npm test` runs the Vitest API tests.
- `npm run lint` runs the TypeScript no-emit check.

## API foundation

- `GET /api/health` is public liveness and does not claim that MongoDB is ready.
- `GET /api/health/ready` is public readiness and returns `503` until MongoDB is connected.
- `/api/auth` contains validated registration/login boundaries and bearer-token account access.
- `/api/auth/google` verifies Google ID tokens when `GOOGLE_CLIENT_ID` is configured; it preserves existing admin roles and never accepts a browser-supplied role.
- `/api/auth/otp/request` and `/api/auth/otp/verify` define hashed, expiring OTP behavior. Delivery remains disabled until an approved provider is configured.
- `/api/projects` contains public catalogue reads and admin-protected creation.
- `/api/project-requests` stores authenticated student requests, returns only the student's own requests, and exposes admin review routes behind the admin role guard.
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

Node's `dns.setServers()` affects Node's c-ares resolver used for SRV lookups in this process. It does not change Windows system DNS settings and may be blocked by corporate networks; in that case set `MONGODB_DNS_SERVERS` to approved DNS servers or use the non-SRV connection string supplied by Atlas.

## Google Cloud setup

Create an OAuth 2.0 Web application credential in Google Cloud Console, add the exact local callback URL from `GOOGLE_REDIRECT_URI` to the authorized redirect URIs, and add the frontend origin to authorized JavaScript origins. Copy only the client ID and secret into the local `.env`; never commit them. Production deployment must use HTTPS and a separate credential.