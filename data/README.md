# Europa living atlas data

This folder is the editorial source of truth for the atlas. It separates the
official county-country initiative from the more specific local-to-local
research that students will develop.

## Files

- `site.json` contains project identity, scope, status definitions, editorial
  principles and the project-wide permissions policy.
- `counties.json` is the accessible county index. A value of
  `not-yet-recorded` means that the atlas has not yet added and checked the
  relevant pairing; it does **not** mean that no official pairing exists.
- `county-map.json` is the web-ready geometry generated from the attributed
  Tailte Éireann boundary dataset and joined to the county index.
- `pairings/cork-france.json` is the first complete content record and the
  template for future pairing pages.

## Two layers that must not be confused

Every record keeps two concepts separate:

1. The **official umbrella pairing** joins an Irish county to a European
   country through the 2026 initiative. It must have an official source.
2. The **local research focus** is a specific region, city, department,
   county-equivalent or other appropriate locality abroad. It is chosen for
   student collaboration and must never be described as an official pairing
   unless an official source explicitly says so.

For Cork, the verified official umbrella pairing is Cork-France. The French
local research focus remains `unassigned`. Do not replace that value with a
guess.

## Editorial workflow

1. Copy the Cork-France record to a new, lowercase pairing slug.
2. Add the official source and identify precisely which claim it supports.
3. Keep a proposed local focus at `unassigned` or `under-review` until it has
   been agreed and sourced.
4. Treat similarities, differences and stories as `research-lead` entries
   until their findings have evidence and editorial approval.
5. Collect at least three sourced comparisons, two reliable sources and a
   consented student perspective for a full profile.
6. Update `lastReviewed`, `reviewedBy` and the applicable status labels after
   review.
7. Add the pairing slug to the matching county record only when the page is
   ready for publication.

## Evidence rules

- Use a source reference ID for every factual claim.
- Prefer official, archival, academic and institutional sources.
- State what a source supports and what it does not support.
- Keep research questions and interpretations visibly separate from facts.
- A research lead is not a verified finding.
- The Cork Huguenot material must remain a `research-lead` until it is sourced,
  reviewed and shown to be relevant to the eventual French locality. It is not
  the official rationale for Cork-France.

## People, permissions and attribution

Student and community names, quotations, images and submitted work require
recorded permission before publication. Record third-party media licences and
credits in the pairing's `permissions` and `attributions` sections. Do not use
placeholder names.

## Status language

Use only the shared labels defined in `site.json`:

- `verified`
- `under-review`
- `research-lead`
- `unassigned`
- `not-yet-recorded`

Additional workflow statuses such as `published-prototype` describe the page,
not the truth of an individual claim.

## Validation

All JSON files must parse successfully before publication. From PowerShell:

```powershell
Get-ChildItem data -Recurse -Filter *.json |
  ForEach-Object { Get-Content $_.FullName -Raw | ConvertFrom-Json | Out-Null }
```

Parsing proves that the JSON is structurally valid; editorial review is still
required to prove that the content is accurate and publishable.

Regenerate the county map after an intentional county-status change with:

```powershell
node scripts/build-county-map.mjs
```

The source GeoJSON is not committed because the generated map is sufficient for
the site. Its official download page, licence and transformation notes are
recorded in `county-map.json` and `ATTRIBUTIONS.md`.
