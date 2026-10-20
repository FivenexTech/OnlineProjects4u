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
- `RESEND_API_KEY`: server-only Resend API key. Leave it empty for local development without email delivery; OTP requests then fail closed without exposing secrets.
- `RESEND_FROM_EMAIL`: sender address for OTP emails, defaulting to `noreply@onlineprojects4u.in`. The address or its domain must be verified in Resend.
- `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_PROVIDER_API_KEY`: legacy provider settings retained for compatibility; OTP delivery uses the official Resend SDK and the `RESEND_*` variables above.
- `RAZORPAY_*` and `PRIVATE_STORAGE_BUCKET`: reserved placeholders; Razorpay verification and private storage remain deferred.
- `ADMIN_EMAIL`: normalized email used by the explicit administrator bootstrap. Never commit `.env` or expose credentials in chat.

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
- `/api/auth/otp/request` and `/api/auth/otp/verify` define hashed, expiring OTP behavior. Requests are generic, resend cooldowns do not reveal account existence, and delivery fails closed until `RESEND_API_KEY` is configured.
- `/api/projects` contains public catalogue reads and admin-protected creation.
- `/api/project-requests` stores authenticated student requests, returns only the student's own requests, and exposes admin review routes behind the admin role guard.
- `/api/support` requires an authenticated student/admin.
- `/api/admin` requires an authenticated admin role on every route.
- Project prices and coupon values are validated integer INR amounts. Order creation recalculates prices from MongoDB, supports one coupon per order, and stores immutable price/discount snapshots.
- `/api/admin/coupons` is admin-only. Used coupons cannot be deleted; deactivate them instead. Coupon usage limits are reserved inside the order transaction.
- Payment creation only creates an unverified payment record. Razorpay verification/webhooks and private storage downloads remain explicitly deferred.

## Initial admin provisioning

There is no public admin registration endpoint. Set the intended email in the untracked `.env`, register that address through the normal passwordless flow, complete email OTP verification, then run:

```powershell
npm run provision:admin
```

The script promotes only an existing, already verified account whose normalized email matches `ADMIN_EMAIL`. It never creates an account, marks an account verified, accepts a role payload, or changes unrelated users. Missing or invalid configuration fails safely. Existing admin roles are never changed by public registration or Google account linking.

## Common connection errors

- `MONGODB_URI is required` or `JWT_SECRET must be at least 32 characters`: `.env` is missing or still contains an invalid placeholder. The API intentionally refuses to start.
- `querySrv ENOTFOUND`: check the Atlas SRV hostname and that the connection string was copied completely.
- `Authentication failed`: verify the Atlas database username/password and URL-encode special password characters.
- `IP ... is not allowed`: add the current machine IP in Atlas **Network Access**.
- `Server selection timed out`: confirm the cluster is running, the URI is correct, and network access allows this machine.
- `GET /api/health` succeeds but `/api/health/ready` returns `503`: the process is reachable, but MongoDB is not connected yet.

## Email verification policy

New student accounts must verify their email before login. Registration creates an unverified account and sends a six-digit OTP through Resend. Codes expire after 10 minutes, can be requested once per minute, allow five attempts, and are invalidated after successful use. If Resend is unavailable, registration fails closed and no session token is issued.

Create a Resend API key at [resend.com](https://resend.com), add and verify the sending domain, then set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in the untracked server `.env`. Never put provider keys in the client environment. For local testing, use a verified sender address and send only to permitted recipients on any Resend account still in its testing state.

To exercise the OTP flow locally:

```powershell
Set-Location server
npm ci
npm run dev
```

With the API running, request a code and then submit the six-digit code received by email:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/otp/request -ContentType 'application/json' -Body '{"email":"student@example.com"}'
Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/otp/verify -ContentType 'application/json' -Body '{"email":"student@example.com","purpose":"email_verification","code":"123456"}
```

For deployment, provide `MONGODB_URI`, `JWT_SECRET`, `SESSION_TTL_DAYS`, `COOKIE_SECURE=true`, `CLIENT_ORIGIN`, `RESEND_API_KEY`, and a verified `RESEND_FROM_EMAIL` through the deployment secret/configuration store. Do not commit or copy `.env` into the image or frontend bundle.

Node's `dns.setServers()` affects Node's c-ares resolver used for SRV lookups in this process. It does not change Windows system DNS settings and may be blocked by corporate networks; in that case set `MONGODB_DNS_SERVERS` to approved DNS servers or use the non-SRV connection string supplied by Atlas.

## Google Cloud setup

Create an OAuth 2.0 Web application credential in Google Cloud Console, add the exact local callback URL from `GOOGLE_REDIRECT_URI` to the authorized redirect URIs, and add the frontend origin to authorized JavaScript origins. Copy only the client ID and secret into the local `.env`; never commit them. Production deployment must use HTTPS and a separate credential.