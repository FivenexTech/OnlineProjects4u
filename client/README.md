# OnlineProjects4U

A polished React + Vite storefront concept for educational software project kits. The current frontend uses demonstration catalogue data only: payments, authentication, database integration, and protected downloads are intentionally not implemented.

## Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For a production check:

```bash
npm run build
```

To connect the login and registration forms to the configured API, create `client/.env.local` from `.env.example` and set `VITE_API_URL` to the API URL. Do not place MongoDB, JWT, Google client secrets, email keys, or other provider secrets in the client environment.

## Stack

- React 19, TypeScript, and Vite
- Tailwind CSS v4 with the Vite plugin
- React Router for page navigation
- Lucide React for interface icons
- Motion for React page and component animation

## Pages

Home, Browse Projects, Project Details, About Us, Contact / FAQ, and Cart are available through the app navigation. Project data lives in `src/data.ts` so it can later be replaced by an API without changing the UI components.

The `/build` route contains a rules-based project idea wizard. It saves drafts locally and clearly labels its proposal preview as non-AI; authenticated MongoDB request submission will be connected in a later client integration stage.