# Overlap

**Find the meeting time that works for everyone — no accounts, no friction.**

🔗 Live: [overlapwhen.com](https://overlapwhen.com)

---

## Overview

Overlap is a group availability polling app (a modern When2meet alternative) built for small teams and friend groups. One person creates a poll, shares a link, and everyone marks when they're free. Overlap ranks the best meeting times and lets the group lock in a final time — all without a single sign-up.

## Problem Statement

Scheduling a meeting across a group usually devolves into long chat threads, timezone confusion, and endless back-and-forth. Existing tools either require every participant to create an account, or bury the answer behind cluttered interfaces. Overlap removes both barriers: participants join with just a name, and the best time surfaces automatically from the group's combined availability.

## Key Features

- **Zero-signup participation** — join a poll with just a name; the first respondent sets a 4-digit PIN that protects their response and organizer powers across devices.
- **Timezone-aware availability grids** — slots are stored in UTC and rendered in each viewer's local timezone, with a per-poll timezone toggle.
- **Smart recommendations** — ranked Top 3 meeting times with attendee counts, percentages, missing-attendee lists, and tie explanations.
- **One-click lock-in** — anyone with the link can lock the final time (with confirmation); the finalized time is shown prominently and appended to a visible lock-in history.
- **Collaborative controls** — lock/reopen are open to the group; closing a poll early stays restricted to the organizer (verified by name + PIN, works across browsers).
- **Share anywhere** — native share sheet on mobile with a selectable-message fallback for desktop.
- **My Polls** — device-local history of every poll you've created or visited, with status badges (Active / Locked / Closed / Expired), filters, search, and automatic refresh.
- **Live sync** — poll pages refresh every 5 seconds and My Polls every 30 seconds, with cross-tab invalidation, so votes, locks, and closures appear without manual reloads.
- **Calendar-safe design** — month pickers and time grids are fully contained and touch-friendly on phones, with 15/30/45/60-minute slot sizes.
- **Accessibility-first** — 44px touch targets, keyboard-navigable grids and pickers, screen-reader labels, and visible focus states throughout.

## Tech Stack

- **Frontend:** React 19, TanStack Start (SSR), TanStack Router & Query, Tailwind CSS v4, Radix UI, Lucide icons
- **Backend:** Lovable Cloud (Postgres + Row Level Security), TanStack server functions
- **Security:** scoped RPC reads (`read_shared_poll`), no direct public table access, SHA-256 PIN hashes, expiring share links (21 days)
- **Testing:** Vitest + Testing Library, Playwright-verified responsive QA

## Screenshots

| Home & Create | Poll & Availability | Recommendations & Lock-in |
| --- | --- | --- |
| _Screenshot coming soon_ | _Screenshot coming soon_ | _Screenshot coming soon_ |

> To add screenshots: capture the homepage, a poll's availability grid, and the Top 3 recommendations panel, save them under `docs/screenshots/`, and replace the placeholders above.

## Architecture Notes

- Availability slots are stored as **UTC epoch minutes**; all grid math lives in `src/lib/slots.ts`, so viewers in different timezones share one source of truth.
- Poll reads go through a **SECURITY DEFINER RPC** that validates the shared-link ID and returns only allowlisted fields — anonymous users never touch base tables.
- Writes use a **serial queue** with versioned save feedback so rapid edits never race.
- Server-side logic uses TanStack Start `createServerFn`; privileged operations load the admin client inside the handler only.

## Future Roadmap

- [ ] Optional email notifications when a time is locked in (with calendar invites)
- [ ] In-app / tab-title notifications for finalized polls
- [ ] Calendar export (`.ics`) for locked times
- [ ] Poll templates (recurring meeting presets)
- [ ] Participant heatmap export / shareable results image
- [ ] Dark-mode refinement pass

## Development

```sh
git clone https://github.com/adiazh3/overlapwhen.git
cd overlapwhen
npm install
npm run dev
```

Environment variables (publishable, safe to expose) live in `.env`; server-only secrets are injected by the hosting platform and are never committed.

## Branching Strategy

- `main` — production, synced two-way with Lovable. All releases ship from here.
- `feature/<name>` — short-lived branches for local development; merge into `main` via pull request.
- `lovable-sync*` — created automatically by Lovable if the two sides ever diverge; merge it into `main` to resolve.

Keep local work on feature branches and merge into `main`; Lovable only syncs the branch selected in Project Settings → Git.

---

Built with [Lovable](https://lovable.dev) · React · TanStack Start · Tailwind CSS
