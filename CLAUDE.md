# CLAUDE.md

This file provides guidance to AI assistants working in this repository.

## Project Overview

**AI Research Tool** — A qualitative user research synthesis application for product teams. Built with React, TypeScript, and ShadCN UI. It enables researchers to organize study insights, track confidence levels, link supporting quotes, and manage learning objectives.

The app includes an Airtable integration layer (mock mode by default) for data persistence.

## Tech Stack

- **React 18.3+** with TypeScript
- **Vite** for bundling and dev server
- **React Router v7** (Data mode with `createBrowserRouter`)
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- **ShadCN UI** components (manually installed in `src/components/ui/`)
- **Radix UI** primitives for accessible components
- **Lucide React** for icons
- **class-variance-authority** + **clsx** + **tailwind-merge** for styling utilities

## Repository Structure

```
src/
├── app/
│   ├── data/
│   │   ├── types.ts          # TypeScript interfaces (Study, KeyLearning, Quote, etc.)
│   │   └── mockData.ts       # Sample data (Oracle Cloud Console usability study)
│   ├── pages/
│   │   ├── Overview.tsx       # Main dashboard (route: /)
│   │   └── InsightDetail.tsx  # Insight detail view (route: /insight/:insightId)
│   ├── services/
│   │   └── airtable.ts       # Airtable service layer (mock mode by default)
│   └── routes.ts             # React Router configuration
├── components/
│   └── ui/                   # ShadCN UI components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dropdown-menu.tsx
│       └── progress.tsx
├── lib/
│   └── utils.ts              # cn() utility for className merging
├── App.tsx                   # Root component with RouterProvider
├── main.tsx                  # Entry point
└── index.css                 # Tailwind CSS v4 config + theme variables
```

## Commands

- `npm run dev` — Start development server
- `npm run build` — Type-check and build for production (output in `dist/`)
- `npm run lint` — Run ESLint
- `npm run preview` — Preview production build locally

## Routes

| Path | Component | Description |
|---|---|---|
| `/` | `Overview` | Main dashboard with insights, goals, objectives, next steps |
| `/insight/:insightId` | `InsightDetail` | Detailed view of a single insight with quotes |

## Design Conventions

- **Professional wireframe aesthetic** — clean, minimal, grayscale palette
- **ShadCN components everywhere** — Card, Button, Badge, Checkbox, Progress, DropdownMenu
- **8px spacing grid** — use `p-6`, `p-8`, `gap-3`, `gap-6`
- **Typography hierarchy** — `text-3xl` titles, `text-lg` headers, `text-base` body
- **No bright colors** — stick to default ShadCN variants and `muted-foreground`
- Import path alias: `@/` maps to `src/`

## Data Model

The core data type is `Study`, containing:
- `goals`, `learningObjectives`, `nextSteps` — checkable items
- `keyLearnings` — insights with confidence scores, tags, quotes, and tracked objectives

See `src/app/data/types.ts` for the full type definitions.

## Airtable Integration

The service in `src/app/services/airtable.ts` runs in mock mode by default (`USE_MOCK_DATA = true`). Mock responses simulate 200-300ms network delay. To connect to a real Airtable base, set `USE_MOCK_DATA = false` and provide `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID`.

## Notes for AI Assistants

- Read this file at the start of every session.
- Use `@/` import alias for all `src/` imports.
- When adding new ShadCN components, place them in `src/components/ui/`.
- The app uses optimistic UI updates — local state updates immediately, then syncs with the service layer.
- Prefer editing existing files over creating new ones.
- Keep the professional wireframe aesthetic — no bright colors or decorative elements.
