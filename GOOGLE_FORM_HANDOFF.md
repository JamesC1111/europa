# Contribution moderation handoff

The public contribution page embeds the Europa Society Google Form. The form
should be owned by the Europa Society account, not an individual account.

## Committee workflow

1. In Google Forms, use the **Responses** tab to create or link a response
   spreadsheet owned by Europa Society.
2. Add an `Approval Status` column to that spreadsheet. New submissions should
   remain blank or be marked `Waiting for verification`.
3. A committee reviewer checks each submission. Only rows marked `Approved`
   may be published in a county profile.
4. Do not publish the raw response spreadsheet. It can include names, email
   addresses and unreviewed submissions.

## Website integration still required

For automatic publication, the committee needs to provide a safe feed that
contains **only approved, public fields**. A suitable feed should provide:

- county slug, for example `cork`
- title
- contribution text
- optional source URL
- approval status

The site currently reads `data/approved-contributions.json` as an empty safe
placeholder. Once the committee shares the approved-only feed URL, this can be
switched to the live source without exposing raw form responses.
