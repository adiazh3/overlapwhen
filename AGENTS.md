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
- No user accounts: all writes go through server functions in src/lib/events.functions.ts using the admin client, which check the organizer token / name PIN; the browser only reads (column-level grants hide admin_token and pin_hash). Why: zero-auth app must still protect organizer actions and PIN-locked responses.
- Availability slots are stored as UTC epoch minutes; grid math lives in src/lib/slots.ts. Why: viewers in different timezones share one source of truth.
