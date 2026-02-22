---
name: tailwind-ui-refresh
overview: Install Tailwind CSS v4 using the official Vite plugin, then refactor the Landing + Tasks pages to a cleaner Tailwind-based UI with improved accessibility and consistent components (dark-first theme, no router changes).
todos:
  - id: tw-install
    content: "Install Tailwind v4 (`tailwindcss`, `@tailwindcss/vite`), wire plugin into `vite.config.ts`, and update `src/index.css` to import Tailwind + keep tokens with `color-scheme: dark`."
    status: completed
  - id: ui-primitives
    content: Add small reusable UI primitives (`Button`, `Card`, `Field`) to standardize spacing, focus states, and error styling.
    status: completed
  - id: landing-tailwind
    content: Refactor `src/pages/Landing.tsx` to Tailwind (hero, status pill, CTA) and remove reliance on `landing.css`.
    status: completed
  - id: tasks-tailwind
    content: Refactor `src/pages/Tasks.tsx` to Tailwind with improved form UX (labels, errors, loading, empty state) and delete confirmation.
    status: completed
  - id: cleanup-build
    content: Remove/deprecate old CSS files/imports, ensure `npm run build` passes, and do a quick manual smoke test.
    status: completed
isProject: false
---

# Tailwind install + UI/UX refactor (dark-first)

## Decisions (confirmed)

- Tailwind setup: **Tailwind v4+ with `@tailwindcss/vite` plugin** (no PostCSS/autoprefixer needed).
- Theme: **keep dark-first** (no light/dark toggle yet).

## Tailwind installation + wiring

- Add dev deps (repo root): `tailwindcss`, `@tailwindcss/vite`.
- Update `[vite.config.ts](vite.config.ts)`:
  - Add `tailwindcss()` plugin alongside React plugin.
- Update `[src/index.css](src/index.css)`:
  - Replace current content with Tailwind import `@import "tailwindcss";`
  - Re-add your existing CSS variables in a `:root { ... }` block
  - Fix `color-scheme` to **dark** (currently set to `light` despite dark UI)
  - Keep your `:focus-visible` outline rule (or map to Tailwind `ring` utilities later)

## Refactor strategy (no extra UI libraries)

- Remove most page-specific CSS and migrate styling to Tailwind classes.
  - Deprecate `[src/pages/landing.css](src/pages/landing.css)`
  - Deprecate `[src/pages/tasks.css](src/pages/tasks.css)`
- Create small reusable UI primitives (thin wrappers) to keep Tailwind class strings manageable:
  - `[src/components/Button.tsx](src/components/Button.tsx)` (variants: primary/ghost/danger)
  - `[src/components/Card.tsx](src/components/Card.tsx)`
  - `[src/components/Field.tsx](src/components/Field.tsx)` (label + input/textarea + error wiring)
  - (Optional) `[src/components/Pill.tsx](src/components/Pill.tsx)` for status chips

## Landing page improvements

- Update `[src/pages/Landing.tsx](src/pages/Landing.tsx)`:
  - Keep hero layout but implement via Tailwind (better spacing + typography scale)
  - Keep API status pill, improve contrast and spacing
  - Update external link to include `rel="noopener noreferrer"`

## Tasks page UX/accessibility improvements

- Update `[src/pages/Tasks.tsx](src/pages/Tasks.tsx)`:
  - Convert layout/forms/list styling to Tailwind
  - **Accessibility**:
    - Ensure every field has `name` + sensible `autoComplete` (or `autoComplete="off"` where appropriate)
    - Add `aria-invalid` and `aria-describedby` when validation fails
    - Render errors in a `role="alert"` region
  - **Destructive action**: add delete confirmation (simple `confirm()` for now)
  - Improve empty state and loading state visuals

## Cleanup

- Remove unused CSS imports and delete unused CSS files once Tailwind migration is complete.

## Verification

- `npm run dev` (frontend) renders Landing + Tasks correctly.
- CRUD actions still work.
- `npm run build` passes.

## Quick guideline-driven issues we’ll fix during refactor

- `src/index.css:2` - `color-scheme: light` conflicts with dark UI → set to `dark`.
- `src/pages/Tasks.tsx` - delete action lacks confirmation → add confirm/undo.
- `src/pages/Tasks.tsx` - inputs missing `name`/`autoComplete` and field error associations → add.
- `src/pages/Landing.tsx:54-59` - external link should include `noopener` in `rel` when `target="_blank"`.

