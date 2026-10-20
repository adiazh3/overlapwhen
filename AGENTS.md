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
- Calendar months use intrinsic-height, fixed-layout seven-column tables with fixed-height (44px) full-width day buttons (no aspect-ratio: Safari miscomputes table row heights with it) and inset focus rings; day buttons override shared minimum sizes. Why: complete months must remain contained without calendar scrollbars at narrow widths.
- Shared buttons default to non-submit actions, 44px minimum touch targets, and token-based keyboard outlines; form submissions explicitly set their type. Why: prevent accidental submissions and keep controls accessible across input methods.
- Labeled action buttons use the shared Button's editorial capsule treatment; icon tools and selection controls opt out of arrow decoration. Why: keep actions consistent without confusing calendar, picker, and toggle behavior.
- No user accounts: writes go through server functions in src/lib/events.functions.ts using the admin client; src/lib/poll-actions.ts validates per-action authorization and proposed time boundaries, while response edits check name PINs. Reads use the publishable client and read_shared_poll RPC, requiring one exact shared-link ID and allowlisting safe fields; anon/authenticated have no direct table access. Why: support shared-link scheduling without exposing organizer tokens, PIN hashes, or cross-poll listing.
- Poll views refresh the scoped shared-link read every five seconds while visible and on window focus, rather than direct table subscriptions. Why: preserve automatic group updates without granting unrestricted table reads.
- Availability slots are stored as UTC epoch minutes; grid math lives in src/lib/slots.ts. Why: viewers in different timezones share one source of truth.
- Result charts derive per-slot votes from scoped poll responses through src/lib/poll-results.ts, counting each participant once per slot and using all respondents as the percentage denominator. Why: multi-selection availability results must remain comparable and update with saved responses without new storage.
- Creation time pickers store minutes of day and share a Radix Select with pure option helpers. Why: quarter-hour and hourly choices preserve exact boundaries with standard keyboard navigation and focus return.
- Global chrome (brand link plus the "How it works" tutorial trigger) lives in src/components/SiteHeader.tsx, mounted once in src/routes/__root.tsx above <Outlet />; page-level headers hold only page-specific actions and never duplicate branding. Why: the tutorial must stay reachable from every page without a floating control covering page content.
