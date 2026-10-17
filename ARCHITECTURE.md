# OnlineProjects4U Architecture

## Current boundaries

- `client/` is the existing React + Vite + TypeScript storefront. Its Spatial UI, demo catalogue, routing, cart state, and styles remain unchanged while the API is introduced.
- `server/` is a separate Express + TypeScript API. It owns authentication, authorization, validation, persistence, orders, payment state, protected download authorization, and support operations.
- MongoDB is the intended persistence layer through Mongoose. The health endpoint is available without MongoDB so local API wiring can be checked before infrastructure is provisioned.

## Security boundaries

- Passwords are hashed with bcrypt and never returned from user queries.
- Admin permissions are enforced in server middleware and never trusted from the browser.
- Prices, roles, payment status, and download authorization are server-owned values.
- Payment providers and private object storage are intentionally adapters/placeholders. No fake payment success or public project files are implemented.

## Planned delivery stages

1. Foundation: server runtime, configuration, health, validation, security middleware, tests.
2. Identity and persistence: Mongo models, registration/login/verification/reset flows, role authorization.
3. Catalogue and admin: project/category APIs and protected admin project management.
4. Commerce: cart/order preparation, Razorpay signature/webhook adapters, idempotent payment state.
5. Delivery: private storage adapter and short-lived purchase-authorized download links.
6. Client integration: API client, account, checkout preparation, purchase library, and admin UI.