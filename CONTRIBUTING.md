# Contributing

Thank you for helping students build a careful, useful and welcoming Europa
atlas. Contributions may improve code, accessibility, design, sources,
research, translations or corrections.

## Non-negotiable evidence boundary

Cork–France is the only pairing currently approved as verified in this
repository. It is an official county-to-country pairing.

Do not:

- invent or infer a French locality for Cork;
- describe a research lead as an official rationale;
- label another pairing `Verified` without editorial approval;
- present a whole country as the atlas's local-to-local research focus;
- fabricate a quotation, student, partner institution, date or source; or
- treat generated text as evidence.

A future local focus must be a specific region, department, city or
county-equivalent place abroad, chosen through real collaboration and supported
by evidence.

## Choose the right contribution route

- **Small correction:** open an issue describing the error and linking the
  source.
- **Research or new pairing:** open an issue first so evidence can be reviewed
  before implementation work begins.
- **Code, design or accessibility fix:** open a focused pull request.
- **Sensitive correction or consent withdrawal:** email
  [europasociety@ucc.ie](mailto:europasociety@ucc.ie) rather than posting
  personal information publicly.

## Research submission checklist

A proposal for a pairing page must include:

1. **Official pairing:** the exact Irish county and European country.
2. **Primary evidence:** an official announcement or public-body source that
   explicitly confirms the pairing.
3. **Local research focus:** a locality only when it has been agreed and
   supported; otherwise write `Not yet selected`.
4. **Comparisons:** three to five similarities and differences, each linked to
   a source.
5. **Student perspective:** a real contribution, with informed permission for
   public use.
6. **Human story:** its source, permissions and any safeguarding considerations.
7. **Source list:** at least two reliable sources, including the primary source
   for the official pairing.
8. **Fact boundaries:** separate verified facts, interpretation, reflection and
   open questions.
9. **Review information:** contributor, proposed reviewer and review date.

For each important claim, provide:

| Field | What to record |
| --- | --- |
| Claim | The exact statement proposed for publication |
| Status | `Verified`, `Under review` or `Research lead` |
| Source | Title, publisher, author where available and stable URL |
| Location | Page, section, paragraph or timestamp supporting the claim |
| Accessed | Date the source was checked |
| Notes | Limits, conflicts, translation or interpretation |
| Consent | Permission status where a person, quotation or media item is involved |

Linking a homepage is not claim-level evidence. Reviewers must be able to find
the supporting material directly.

## Source standards

Prefer sources in this order:

1. government, public-body, institutional or archival primary sources;
2. peer-reviewed research and reputable specialist publications;
3. established news organisations with transparent authorship and corrections;
4. named community organisations or first-person testimony, clearly labelled;
5. other sources only when their limitations are explained.

Wikipedia and generative tools may help locate possible sources, but they are
not sufficient evidence for a verified claim. Social posts may document a
person's own statement but do not independently verify broader historical or
institutional claims.

## Development workflow

1. Create a short branch from the latest `main`.
2. Keep one pull request focused on one coherent change.
3. Preserve the evidence status and accessible fallbacks.
4. Run `npm ci` and `npm run check`.
5. Install the test browser once with `npx playwright install chromium`.
6. Run `npm run check:browser` for phone, tablet and desktop evidence.
7. Test any changed interaction with keyboard-only navigation.
8. Describe what changed, how it was verified and what remains uncertain.
9. Request review; do not merge your own research approval.

Never commit passwords, private correspondence, unpublished interview material,
analytics identifiers or personal contact details.

## Pull request description

Include the following:

```text
Purpose:

What changed:

Evidence and source links:

Status labels used:

Consent or rights confirmed:

Accessibility checks:

Phone / tablet / desktop checks:

Known limitations or open questions:
```

If a pull request changes a `Verified` label, it must name the editorial
reviewer and link to the primary evidence. The allow-list in
`scripts/validate-site.mjs` may be changed only after that review.

## Code expectations

- Use semantic HTML before adding ARIA.
- Keep JavaScript progressively enhanced and dependency-light.
- Provide keyboard and non-map alternatives for map interactions.
- Respect `prefers-reduced-motion`.
- Avoid inline scripts, event handlers and style attributes.
- Optimise media without overwriting archival originals.
- Use relative internal URLs so GitHub Pages works below `/europa/`.
- Do not add tracking, advertising or third-party embeds without explicit
  approval and a privacy review.
- Keep visible public branding focused on Europa Society at UCC.

## Editorial expectations

Follow [EDITORIAL_POLICY.md](EDITORIAL_POLICY.md). A pull request may pass CI and
still be declined when its sources, consent, wording or public value are not
strong enough. Review should be constructive and should preserve uncertainty
rather than smoothing it away.

## Definition of done

A contribution is ready to merge when:

- automated checks pass;
- factual claims have appropriate sources and status labels;
- a different person has completed editorial review;
- permissions and attribution are recorded;
- accessibility and responsive behaviour have been checked;
- the change does not overstate the official initiative; and
- the pull request records any remaining uncertainty.
