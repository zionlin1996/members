# CLAUDE.md — members (frontend)

React 19 + React Router v7 + Chakra UI v2 + TypeScript + Vite.

## Stack

- **Router**: React Router v7 (explicit config in `app/routes.ts`, not file-based)
- **UI**: Chakra UI v2 — all design tokens and component variants live in `app/theme.ts`
- **Icons**: `react-icons` — use `react-icons/fa` for brand icons, `react-icons/md` for UI icons
- **Package manager**: Yarn (never use npm)

## Project structure

```
app/
  routes.ts             # Route config — source of truth for all routes
  root.tsx              # App shell (ChakraProvider, theme)
  theme.ts              # Design tokens, semantic tokens, component variants
  routes/
    home.tsx            # Landing page
    register/
      index.tsx         # Layout route: card wrapper + withRegisterContext HOC
      identity.tsx      # /register — step 1
      method.tsx        # /register/method — step 2
  context/
    RegisterContext.tsx # Context + useRegisterContext hook + withRegisterContext HOC
  components/           # Reusable, route-agnostic UI only
  libs/
    username.ts         # deriveUsername, isValidUsername
```

## Folder conventions

- **`routes/`** — route components own their page logic, state, and JSX. Each route file is self-contained. Sub-routes are co-located in a folder named after the parent route.
- **`components/`** — shared, reusable UI elements only. If a component is used by exactly one route and is not a generic building block, it belongs in the route file, not here.
- **`context/`** — React contexts, custom hooks, and HOCs that cross route boundaries.
- **`libs/`** — pure utility functions with no React dependencies.

## Style system

All colours, spacing, and component behaviour come from `app/theme.ts` — never use raw hex values or magic numbers inline. Add provider-specific colours (Google, Telegram) as named palettes; add semantic aliases (`bg.base`, `text.muted`, etc.) as semantic tokens; add component presets as Chakra component variants.

## Routing

Routes are declared explicitly in `app/routes.ts`. Use `layout()` for shared wrappers, `route()` for URL segments, `index()` for index routes. Prefer `useNavigate` + `useEffect` over `<Navigate>` for guards (the latter throws internally in RR v7 without an error boundary).

## Running locally

```bash
yarn install
yarn dev   # http://localhost:5173
```

Requires `VITE_API_URL=http://localhost:3000` in `.env` (copy from `.env.example`).
