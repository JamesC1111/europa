# Europa Society at UCC — County Pairings

[![Quality checks](https://github.com/JamesC1111/europa/actions/workflows/quality.yml/badge.svg)](https://github.com/JamesC1111/europa/actions/workflows/quality.yml)

A student-built, evidence-led atlas exploring connections between Irish counties
and Europe. The project begins with Ireland's official 2026 Cork–France pairing
and is intended to grow through collaboration between students who know both
places.

**Live site:** <https://jamesc1111.github.io/europa/>

## Current evidence boundary

**Cork–France is the only pairing currently approved as verified in this
repository.**

- The verified claim is the official county-to-country pairing: **Cork ↔
  France**.
- No French region, department, city or other locality has yet been selected or
  verified as Cork's local research focus.
- Cork's Huguenot connections are a **research lead**, not the official reason
  for the pairing.
- No other pairing may be labelled `Verified` until it passes the process in
  [EDITORIAL_POLICY.md](EDITORIAL_POLICY.md).

This is the repository's publication status, not a claim that Cork–France is the
only pairing in the wider government initiative. The primary source for the
official initiative is the [Government of Ireland announcement][official-source].

## What a complete pairing page contains

Each published pairing should make the distinction between an official pairing
and a local student research focus unmistakable. A complete page contains:

1. the official Irish county–European country pairing and its primary source;
2. a named local research focus only when it has been agreed and sourced;
3. the student team and reviewer names, where consent has been recorded;
4. three to five sourced similarities and differences;
5. one responsibly gathered human story or student perspective;
6. open research questions;
7. claim-level sources and a last-reviewed date;
8. an accessible quiz; and
9. a clear route for contributing or correcting material.

The atlas is not a tourism directory. It is a living student research record
about people, places, similarities, differences and the evidence connecting
them.

## Status labels

| Label | Meaning |
| --- | --- |
| `Verified` | Supported by the required evidence and approved by an editorial reviewer |
| `Under review` | Submitted evidence is being checked and must not yet be presented as fact |
| `Research lead` | A question, possible connection or story that still needs evidence |

A label applies only to the claim or section beside it. It must never imply that
every statement on a page has been verified.

## Technology

The site is deliberately lightweight:

- semantic HTML;
- responsive CSS;
- small, dependency-free JavaScript;
- structured JSON for counties, profiles and editorial status; and
- GitHub Pages hosting.

There is no runtime framework or mandatory deployment build. The county map has
a reproducible data-generation script, while the published site remains static.
This keeps the project inexpensive, auditable and easy for future student teams
to maintain.

## Run locally

Use any static web server from the repository root. For example:

```text
python -m http.server 8000
```

Then open `http://localhost:8000`.

Use a local server rather than opening `index.html` directly: the interactive
county map loads its reviewed data through a browser request, matching how
GitHub Pages serves the site.

## Quality checks

Pull requests and changes to `main` run:

- local asset and fragment-link validation;
- semantic and evidence-boundary checks;
- county dataset and generated-map consistency checks;
- JavaScript syntax checks;
- HTML validation;
- CSS linting; and
- Markdown linting;
- WCAG 2.2 accessibility checks;
- browser-console and responsive-overflow checks;
- core interaction checks; and
- phone, tablet and desktop screenshots retained as a CI artifact.

Run the dependency-free project validator locally with:

```text
node scripts/validate-site.mjs
```

The complete CI commands are recorded in
[`.github/workflows/quality.yml`](.github/workflows/quality.yml).

For the complete local pass:

```text
npm ci
npx playwright install chromium
npm run check
npm run check:browser
```

Passing automation is necessary but not sufficient. Content still needs human
source review, consent review and visual testing on phone, tablet and desktop.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing code or research.
Editorial decisions follow [EDITORIAL_POLICY.md](EDITORIAL_POLICY.md). Please do
not add a pairing, locality, quotation, person's name or photograph without the
required evidence or permission.

Corrections and carefully sourced contributions can be proposed through a
GitHub issue or pull request, or by emailing
[europasociety@ucc.ie](mailto:europasociety@ucc.ie).

## Repository guide

| Path | Purpose |
| --- | --- |
| `index.html` | Atlas home and county explorer |
| `pairings/` | Permanent pairing profile routes |
| `contribute/` | Structured contribution and research guidance |
| `styles.css` | Presentation and responsive layout |
| `script.js` | Map, filtering, sharing and quiz interactions |
| `data/site.json` | Public site scope, statuses and editorial principles |
| `data/counties.json` | Canonical county publication status |
| `data/pairings/` | Claim-level pairing records |
| `data/county-map.json` | Web-ready county geometry and matching status data |
| `scripts/build-county-map.mjs` | Reproducible map-data generator |
| `scripts/validate-site.mjs` | Dependency-free structural and editorial guardrails |
| `EDITORIAL_POLICY.md` | Evidence, consent, review and correction rules |
| `ATTRIBUTIONS.md` | Asset provenance and reuse status |

## Accessibility

The project aims for WCAG 2.2 AA. Every change should preserve keyboard access,
visible focus, useful alternative text, readable contrast, reduced-motion
support, logical headings, descriptive links and touch targets large enough for
comfortable use. New interactions must have a non-map and non-pointer
alternative.

## Publishing

`main` is the canonical source branch. GitHub Pages should publish only reviewed
commits from `main`. A deployment is not an editorial approval: reviewers must
also confirm the live page, its assets, mobile layout, sharing preview, console
state and public access.

## Licence and asset exceptions

Original project **code** is licensed under the [MIT Licence](LICENSE).

The MIT Licence does **not** grant rights to:

- the Europa Society at UCC name or logo;
- UCC or third-party names, marks or emblems;
- photographs, flags, map artwork or other third-party assets;
- contributor-submitted stories, quotations or research content; or
- personal information and material used with consent.

Each asset's status is documented in [ATTRIBUTIONS.md](ATTRIBUTIONS.md). Content
without an explicit licence remains excluded from the MIT Licence.

[official-source]: https://www.gov.ie/en/department-of-foreign-affairs/press-releases/eu-presidency-county-pairings-announced-by-ministers-mcentee-and-byrne/
