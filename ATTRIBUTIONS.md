# Attributions and asset rights

The project's MIT Licence covers original source code only. It does not
automatically cover research content, logos, maps, quotations, photographs or
contributor-submitted media.

## Current asset register

| File or service | Creator or source | Licence or status | Required treatment |
| --- | --- | --- | --- |
| `data/county-map.json` | [Tailte Éireann, Counties - National Statutory Boundaries - 2019 - Generalised 20m](https://data.gov.ie/dataset/counties-national-statutory-boundaries-2019-generalised-20m1) | [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/) | Attribute Tailte Éireann. Geometry has been web-simplified and scaled from Irish Transverse Mercator; it is illustrative, not a legal boundary record |
| `europa-society-logo.png` and cropped `favicon.png` | Europa Society at UCC project-supplied mark | Excluded from MIT; no general reuse licence recorded | Use only for this project or with permission from the mark's owner |
| `og-share.png` | Project-directed image generation, 30 July 2026 | Project-use social asset, excluded from MIT | Keep the visible wording accurate; do not use it to imply UCC, Irish Government or EU endorsement |
| Irish and French flag motifs in CSS | Original CSS representations of the national tricolours | MIT as code; national-symbol rules may still apply | Use factually and without implying endorsement |
| Original HTML, CSS, JavaScript and validation scripts | Europa Society at UCC project contributors | MIT | See `LICENSE` |
| Original editorial copy and student research | Relevant authors and contributors | Excluded from MIT unless a separate content licence is explicitly adopted | Obtain contributor permission and preserve authorship and source records |

## Boundary-data modification

The published county paths were generated from the attributed Tailte Éireann
dataset using `scripts/build-county-map.mjs`. The script:

1. reads the official GeoJSON in Irish Transverse Mercator;
2. simplifies geometry for a small, responsive web map;
3. scales it to the site's SVG view box; and
4. combines geometry with the separately reviewed editorial county status.

The map is an interface, not a survey, navigation aid or legal definition of a
boundary.

## Emblems and institutional marks

The presence of a flag, name or mark does not imply endorsement by the European
Union, the Government of Ireland or University College Cork. The MIT Licence
does not grant permission to reuse UCC or Europa Society names or marks in
another product or to create a confusingly similar identity.

## Adding an asset

Before committing a new asset, add a row recording:

1. exact filename;
2. creator and original source URL;
3. licence or written permission;
4. required credit;
5. modifications made;
6. consent status where a person appears; and
7. restrictions on redistribution, cropping or commercial use.

Do not use `found online` or a search-results page as provenance. If rights
cannot be established, do not publish the asset.

## Corrections

Rights holders and contributors can request an attribution correction or raise
a rights concern through
[europasociety@ucc.ie](mailto:europasociety@ucc.ie). Provide the filename,
original source and the requested change. Material may be temporarily removed
while a concern is reviewed.
