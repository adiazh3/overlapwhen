# Overlap redesign — "Midnight & Titanium" (Sourdough-inspired editorial minimalism)

## Direction
High-craft European editorial look: huge tightly tracked headlines, generous whitespace, hairline dividers, numbered sections, monospaced micro-labels, restrained motion. Deep midnight navy anchors everything; cool titanium greys carry surfaces; one electric cobalt accent used sparingly (focus, live indicators, "best time" highlights).

## Palette
- Midnight (primary / ink): #011B34
- Deep surface (dark bands, footer): #0A2440
- Titanium 50 (page background): #F4F5F7
- Titanium 200 (hairlines, muted cells): #D9DDE3
- Titanium 500 (secondary text): #6B7480
- Cobalt accent: #2F6BFF
- Heatmap stays progressive navy density (titanium-50 to #011B34)

## Typography
- Display: Sora (already loaded) at much larger sizes, weight 500, tracking -0.04em, line-height ~0.95
- Body: Manrope (kept)
- Micro-labels: JetBrains Mono, uppercase, 11px, wide tracking (e.g. "01 — CREATE", "LIVE")

## Step-by-step

1. Design tokens
   - Rewrite color tokens in the stylesheet to the palette above; add accent, titanium and dark-band tokens, hairline border, flatter shadow (less blur, more crisp edge).
   - Smaller radius (0.5rem) for a sharper, more architectural feel.
   - Add `font-mono` token and load JetBrains Mono alongside existing fonts.
   - Add utilities: `eyebrow` (mono micro-label), `hairline` (1px titanium divider), `display-xl` (giant headline).

2. Top bar
   - Thinner, translucent titanium background with hairline bottom border.
   - Wordmark-only brand "Overlap" in display font, a small cobalt dot as mark.
   - "My polls" and "How it works" as mono uppercase text links; counts as small outlined chips.

3. Homepage
   - Hero band: eyebrow "Group scheduling — No accounts", giant 2–3 line headline, short subline, and a horizontal heat-density strip as a graphic signature.
   - Numbered three-column "01 Create / 02 Share / 03 Overlap" row separated by hairlines (replaces the bullet list).
   - Create form restyled as a flat panel with hairline sections and mono field labels, numbered steps (Name, Days, Time window, Slot size); primary button full-width midnight with arrow icon.
   - Recent polls shown as a clean hairline table (title, role, expiry).
   - Mobile: headline scales down, form follows hero, all stacked.

4. Poll page
   - Editorial header: eyebrow with dates/timezone, large poll title, share and timezone controls as quiet outlined buttons.
   - Split view kept (your availability / group), each column headed by mono step numbers "01 Your name", "02 Your times", "03 Group".
   - "Top 3 recommended times" becomes a ranked list with large numerals and cobalt highlight on #1.
   - Grid: square-ish cells, hairline gaps, cobalt outline for active slot; live badge as pulsing cobalt dot + "LIVE".
   - Locked final-time card as a dark midnight band with calendar buttons.

5. My polls, Privacy, Terms
   - Same editorial header pattern; history as hairline rows with mono metadata; legal pages with narrow reading column and numbered headings.

6. Footer
   - Dark midnight band with large faded "Overlap" wordmark, mono links (Privacy, Terms), small copyright.

7. Tutorial modal
   - Restyle to match: titanium surface, mono step counter "01 / 03", hairline dots, midnight buttons.

8. Motion
   - Subtle fade-and-rise on section entry and hover underline on links; no heavy animations.

9. Verification
   - Check homepage, poll page, My polls, legal pages and tutorial on phone (434px) and desktop; confirm creating a poll, painting times and group view still work; run existing tests.

## Technical details
- Files touched: src/styles.css, src/routes/__root.tsx (font link), SiteHeader, SiteFooter, index route, e.$id route, history route, LegalPage, HowItWorksTutorial, TutorialHelp, AvailabilityGrid (cell classes only).
- Only presentation changes; no data, server function or database changes.
- All colors via semantic tokens; no hardcoded color classes.
- Save the chosen palette and fonts to project memory.
