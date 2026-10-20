<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Labeled action buttons use the shared Button's editorial capsule treatment; icon tools and selection controls opt out of arrow decoration. Why: keep actions consistent without confusing calendar, picker, and toggle behavior.
- No user accounts: all writes go through server functions in src/lib/events.functions.ts using the admin client, which check the organizer token / name PIN. Reads use the publishable client and read_shared_poll RPC, requiring one exact shared-link ID and allowlisting safe fields; anon/authenticated have no direct table access. Why: protect organizer tokens and PIN hashes and prevent cross-poll listing without adding accounts.
- Poll views refresh the scoped shared-link read every five seconds while visible and on window focus, rather than direct table subscriptions. Why: preserve automatic group updates without granting unrestricted table reads.
- Availability slots are stored as UTC epoch minutes; grid math lives in src/lib/slots.ts. Why: viewers in different timezones share one source of truth.
- Creation time pickers store minutes of day and share a reusable scrollable control with pure option helpers. Why: quarter-hour and hourly choices preserve exact boundaries in poll creation.
- Global chrome (brand link plus the "How it works" tutorial trigger) lives in src/components/SiteHeader.tsx, mounted once in src/routes/__root.tsx above <Outlet />; page-level headers hold only page-specific actions and never duplicate branding. Why: the tutorial must stay reachable from every page without a floating control covering page content.
