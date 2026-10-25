# Overlap product audit — October 25, 2026

## Scope and evidence
Reviewed Home, creation, voting, recommendations, lock/reopen, My Polls, tutorial, legal copy, and mobile behavior. Used source inspection and a real create → vote → reload → recommend → cancel → lock → reopen journey. No conversion analytics baseline was collected: expected completion effects below are hypotheses, not measured uplift. Kept implementation to focused changes, without new accounts, notifications, or schema work. Credit consumption cannot be guaranteed from within this audit.

## Ranked opportunities

| Priority | Finding / abandonment risk | User impact | Ease | Expected completion effect | Outcome |
|---|---|---|---|---|---|
| 1 | Rapid response saves can overlap; failures previously returned to a reassuring “Saved” label | High | Medium | High: fewer lost edits and uncertainty | Ordered writes; explicit saving/saved/error states; retry retains the latest selection |
| 2 | Voting cells were pointer-only; phone grids blocked vertical touch scrolling and wide date ranges required sideways scrolling | High | Medium | High: more participants can complete availability | Native labeled buttons, keyboard activation/arrows, touch-tap selection, vertical scrolling, five-day pagination, 44px-high rows |
| 3 | On phones, recommendations are far below two availability grids | High | Easy | High: less searching between responding and deciding | “Review top times” shortcut near the top and after voting, with focus moved to the heading |
| 4 | Saving availability offered no clear next step; locking could be mistaken for notifying everyone | High | Easy | Medium–high: closes the share → respond → decide → communicate loop | Post-save share action; confirmed-time sharing; explicit notice that notifications are not sent |
| 5 | “Slot size” does not clearly communicate the resulting meeting duration | Medium | Easy | Medium: fewer wrongly configured polls | “Meeting length” plus a concise explanation |
| 6 | My Polls status is browser-local and reflects the last visit, not necessarily the current group state | Medium | Easy | Medium: fewer misleading decisions | Clear freshness caveat; preserved readable text instead of fading whole concluded cards |
| 7 | First-person PIN and recovery responsibilities are easy to overlook | Medium | Easy | Medium: fewer returning-user dead ends | PIN guidance explains cross-browser edits and early closure |
| 8 | Homepage has substantial content before the form; default five days may invite accidental dates | Medium | Medium | Potential medium | Deferred: current CTA jumps to the form; test simpler creation/defaults with conversion evidence first |
| 9 | Calendar silently caps at 31 dates | Medium | Easy | Low–medium | Deferred: make the existing limit explicit in a separate creation validation pass |
| 10 | Missing operator contact details and inaccurate legal device/PIN descriptions reduce trust | Medium | Requires operator input/review | Indirect | Deferred: operator should supply real contact details; legal copy needs review, not invented details |

## Feedback loops still missing
- No automatic reminders or notification delivery; sharing remains explicit and manual.
- Invitee tracking is local to a browser, not a shared team roster, so “everyone” means respondents so far.
- No measured funnel for created → shared → responded → finalized. Instrument only after privacy/consent requirements are decided.
- My Polls does not refresh every saved poll in the background; opening one retrieves its current state.

## Validation
- Real saved selections read back after reload, including rapid phone taps.
- Confirmation cancellation leaves voting open; confirmed lock closes voting and exposes calendar/share actions; reopening permits voting again.
- Keyboard Space toggles availability and ArrowRight moves between slots.
- Home, Poll and My Polls: no document horizontal overflow at 320×740, 430×932, 844×390, and 1280×1800 in Chromium.
- 27 automated tests pass, including new write-ordering and availability-interaction tests.
- No page errors during the validated journey. Real iOS/Android devices and live conversion uplift remain unverified.
- Grid cells are 44px high; columns on the narrowest phones can be under 44px wide to retain five visible days. Day pagination prevents large polls overflowing.

## Recommended next investment
Measure completion before adding features: compare the proportion of created polls receiving a first response and reaching a locked time. Then prioritize creation simplification or reminder delivery based on where groups stop.