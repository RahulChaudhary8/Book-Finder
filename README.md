# Book Finder — Open Library (React + Vite + Tailwind)

A clean, responsive web app to search books using the Open Library Search API.
You can search by title (and optionally author), sort results, paginate, view details,
and save favorites locally.

## Tech
- React + Vite
- Tailwind CSS (+ @tailwindcss/forms)
- Open Library Search API (`/search.json`), cover images via `covers.openlibrary.org`

## Run locally

1. Ensure Node.js 18+ is installed.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start dev server:

   ```bash
   npm run dev
   ```

   Open the printed URL (usually `http://localhost:5173`).

## Deploy (quick options)

- **StackBlitz**: Go to https://stackblitz.com/, create a new **Vite + React** project or upload this folder.
- **CodeSandbox**: Go to https://codesandbox.io/, choose **Vite + React** template or upload this folder.
- **Netlify/Vercel**: Connect the repo, set build command `npm run build` and publish directory `dist`.

## Notes
- This project addresses the ***Book Finder*** user need from the given challenge doc.
- API calls require no API key.
- Book cards use client-side sorting. "Saved" list is stored in `localStorage`.

## Files
- `src/App.jsx` — main UI + logic
- `src/main.jsx` — React entry
- `src/index.css` — Tailwind directives + a few custom utilities
- `index.html` — Vite HTML entry
- `tailwind.config.js` / `postcss.config.js` — Tailwind setup
- `package.json` — scripts & deps

---

Made for the take-home challenge.
