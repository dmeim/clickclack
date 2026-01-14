# Feature Parity Checklist

## Migration Status: Phase 0-1 Complete

This document tracks feature parity between the old Next.js codebase and the new Bun + Vite + Convex architecture.

---

## Core Typing Features

| Feature | Status | Notes |
|---------|--------|-------|
| Time mode | ⬜ Pending | Need to migrate TypingPractice component |
| Words mode | ⬜ Pending | |
| Quote mode | ⬜ Pending | |
| Zen mode | ⬜ Pending | |
| Preset mode | ⬜ Pending | |
| Plan mode | ⬜ Pending | |
| WPM calculation | ⬜ Pending | |
| Accuracy calculation | ⬜ Pending | |
| Progress tracking | ⬜ Pending | |
| Character-by-character display | ⬜ Pending | |
| Cursor animation | ⬜ Pending | |

---

## Ghost Writer Features

| Feature | Status | Notes |
|---------|--------|-------|
| Ghost cursor display | ⬜ Pending | |
| Configurable speed | ⬜ Pending | |
| Enable/disable toggle | ⬜ Pending | |
| Ghost settings modal | ⬜ Pending | |

---

## Sound Features

| Feature | Status | Notes |
|---------|--------|-------|
| Typing sounds | ✅ Ready | Static manifest created |
| Multiple sound packs | ✅ Ready | All packs in manifest |
| Warning sounds | ✅ Ready | Clock sound available |
| Sound settings modal | ⬜ Pending | |
| Enable/disable toggle | ⬜ Pending | |

---

## Theme Features

| Feature | Status | Notes |
|---------|--------|-------|
| Theme colors | ✅ Ready | Static manifest created |
| Multiple themes | ✅ Ready | 6 themes available |
| Custom color picker | ⬜ Pending | Color utils ready |
| Theme persistence | ✅ Ready | Storage utils ready |
| CSS variables | ✅ Ready | Variables in index.css |

---

## Connect/Multiplayer Features

| Feature | Status | Notes |
|---------|--------|-------|
| Host room creation | ⬜ Pending | Needs Convex setup |
| Join room | ⬜ Pending | Needs Convex setup |
| Room code generation | ⬜ Pending | Needs Convex setup |
| Real-time participant list | ⬜ Pending | Needs Convex setup |
| Real-time stats sync | ⬜ Pending | Needs Convex setup |
| Host controls (start/stop) | ⬜ Pending | Needs Convex setup |
| Kick participants | ⬜ Pending | Needs Convex setup |
| Settings sync | ⬜ Pending | Needs Convex setup |
| Reconnection handling | ⬜ Pending | Needs Convex setup |

---

## Settings & Persistence

| Feature | Status | Notes |
|---------|--------|-------|
| localStorage persistence | ✅ Ready | Storage utils copied |
| Settings merge with defaults | ✅ Ready | |
| Theme persistence | ✅ Ready | |
| Font size settings | ⬜ Pending | |
| Text alignment settings | ⬜ Pending | |

---

## UI Components

| Feature | Status | Notes |
|---------|--------|-------|
| Button | ✅ Ready | Shadcn installed |
| Dialog/Modal | ✅ Ready | Shadcn installed |
| Dropdown Menu | ✅ Ready | Shadcn installed |
| Input | ✅ Ready | Shadcn installed |
| Label | ✅ Ready | Shadcn installed |
| Select | ✅ Ready | Shadcn installed |
| Slider | ✅ Ready | Shadcn installed |
| Switch | ✅ Ready | Shadcn installed |
| Tabs | ✅ Ready | Shadcn installed |
| Toasts (Sonner) | ✅ Ready | Shadcn installed |
| ColorPicker | ⬜ Pending | Needs migration |

---

## Routing

| Feature | Status | Notes |
|---------|--------|-------|
| Home page (`/`) | ✅ Ready | Placeholder created |
| Connect page (`/connect`) | ✅ Ready | Placeholder created |
| Host page (`/connect/host`) | ✅ Ready | Placeholder created |
| Join page (`/connect/join`) | ✅ Ready | Placeholder created |
| URL params | ✅ Ready | useSearchParams working |

---

## Infrastructure

| Feature | Status | Notes |
|---------|--------|-------|
| Vite build | ✅ Ready | Build passing |
| TypeScript | ✅ Ready | Strict mode enabled |
| Path aliases (@/) | ✅ Ready | Configured |
| Tailwind CSS v4 | ✅ Ready | |
| Shadcn/UI | ✅ Ready | Components installed |
| Vitest | ✅ Ready | Tests passing |
| Playwright | ⬜ Pending | Config needed |
| Docker | ⬜ Pending | Phase 8 |
| Convex | ⬜ Pending | Phase 4 |

---

## Static Assets

| Asset | Status | Notes |
|-------|--------|-------|
| Sound files | ✅ Ready | Copied to public/sounds |
| Theme files | ✅ Ready | Copied to public/themes |
| Word lists | ✅ Ready | Copied to public/words |
| Quote files | ✅ Ready | Copied to public/quotes |
| Brand assets | ✅ Ready | Copied to public/assets |

---

## Legend

- ✅ Ready - Complete and working
- 🔄 In Progress - Currently being worked on
- ⬜ Pending - Not started yet
- ❌ Blocked - Waiting on dependency

---

*Last updated: January 2026*
