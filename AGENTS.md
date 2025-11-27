# Agent Guidelines

## Commands
- **Build:** `npm run build` (Next.js build)
- **Lint:** `npm run lint` (ESLint)
- **Dev:** `npm run dev` (runs `node server.js`)
- **Test:** No test runner configured currently.

## Code Style & Conventions
- **Framework:** Next.js (App Router), React 19, TypeScript, Tailwind CSS v4.
- **Formatting:** Double quotes, semicolons, 2-space indentation.
- **Naming:** PascalCase for components (`TypingPractice.tsx`), kebab-case for utils (`color-utils.ts`).
- **Imports:** Use `@/` alias for project root. Group external then internal imports.
- **State:** Use React hooks (`useState`, `useEffect`). No class components.
- **Styling:** Tailwind utility classes.
- **Types:** Strict TypeScript; define interfaces in `types/` or co-located.
- **Structure:** `app/` for routes, `components/` for UI, `lib/` for logic.

## Rules
- Always use `use client` for interactive components.
- Verify changes with `npm run build` as there are no tests.
- **Git:** NEVER perform git operations (add, commit, push) unless explicitly requested by the user.
