# Property Management System Design (Community)

React + Vite + Tailwind CSS v4 app, originally exported from
https://www.figma.com/design/ffQZ2tt0K8yGD1yloyFHHJ/Property-Management-System-Design--Community-

## Requirements

- Node.js 20 or newer

## Running the code

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build into `dist/`
- `npm run preview` — serve the production build locally
- `npm run typecheck` — TypeScript check

## Deploying to Vercel

`vercel.json` pins the install/build commands (`npm ci` / `npm run build`), the
output directory (`dist`) and the SPA rewrite. No extra dashboard configuration
is needed; `package-lock.json` must stay committed for `npm ci` to work.
