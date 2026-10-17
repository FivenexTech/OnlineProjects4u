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

## Stack

- React 19, TypeScript, and Vite
- Tailwind CSS v4 with the Vite plugin
- React Router for page navigation
- Lucide React for interface icons
- Motion for React page and component animation

## Pages

Home, Browse Projects, Project Details, About Us, Contact / FAQ, and Cart are available through the app navigation. Project data lives in `src/data.ts` so it can later be replaced by an API without changing the UI components.