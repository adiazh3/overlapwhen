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
- Poll reads share eventQuery cache keys: poll pages refresh every five seconds, device-local history/recent lists every thirty seconds while visible, and both refresh on focus/reconnect; successful writes invalidate the exact poll and notify other tabs. Snapshot updates preserve visit order and clear obsolete final times. Why: keep cards, counts, recommendations and lock states consistent without unrestricted table reads or duplicate caches.
- Availability slots are stored as UTC epoch minutes; grid math lives in src/lib/slots.ts. Why: viewers in different timezones share one source of truth.
- Result charts derive per-slot votes from scoped poll responses through src/lib/poll-results.ts, counting each participant once per slot and using all respondents as the percentage denominator. Why: multi-selection availability results must remain comparable and update with saved responses without new storage.
- Creation time pickers store minutes of day and share a Radix Select with pure option helpers. Why: quarter-hour and hourly choices preserve exact boundaries with standard keyboard navigation and focus return.
- Global chrome (brand link plus the "How it works" tutorial trigger) lives in src/components/SiteHeader.tsx, mounted once in src/routes/__root.tsx above <Outlet />; page-level headers hold only page-specific actions and never duplicate branding. Why: the tutorial must stay reachable from every page without a floating control covering page content.
- Lock-ins append {at,start,end} entries to events.lock_history (capped at 50), exposed via read_shared_poll and shown as a lock-in history on the poll page. Why: participants can see when and what time was locked without a separate table.
- Fonts are self-hosted via @fontsource packages imported at the top of src/styles.css, never a Google Fonts <link>. Why: avoids a render-blocking third-party stylesheet and extra connections on slow phones.
- Availability grids show five days per page with native labeled day-slot buttons and 44px rows; touch taps select and vertical swipes scroll, while mouse dragging remains available. Why: large polls stay usable without sideways scrolling or blocking phone scrolling.
- Browser response writes use a serial queue and versioned save feedback. Why: rapid edits must not race the first response insert or report a failed write as saved.
- Poll creation uses a shared browser-safe time-window validator in the form and server input schema. Why: prevent empty voting grids when the window is shorter than the meeting length.
- Poll invitations and finalized-time sharing use SharePoll with native sharing and a selectable-message dialog fallback. Why: group-chat handoff must work on phones and browsers without clipboard access.
