import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const warnings = [];

const verifiedPairings = new Set([
  // Official county-country pairings announced by the Department of Foreign
  // Affairs and Trade, 16 January 2026. Local profiles remain separate.
  'carlow::luxembourg',
  'cavan::latvia',
  'clare::croatia',
  'cork::france',
  'donegal::poland',
  'dublin::greece',
  'galway::estonia',
  'kerry::czechia',
  'kildare::austria',
  'kilkenny::romania',
  'laois::malta',
  'leitrim::cyprus',
  'limerick::germany',
  'longford::hungary',
  'louth::portugal',
  'mayo::netherlands',
  'meath::italy',
  'monaghan::finland',
  'offaly::belgium',
  'roscommon::slovenia',
  'sligo::lithuania',
  'tipperary::bulgaria',
  'waterford::denmark',
  'westmeath::sweden',
  'wexford::slovakia',
  'wicklow::spain',
]);

function report(list, file, message) {
  list.push(`${relative(root, file) || '.'}: ${message}`);
}

function walk(directory) {
  const ignored = new Set(['.git', 'node_modules', '_site', 'dist']);
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function stripQueryAndFragment(value) {
  return value.split('#', 1)[0].split('?', 1)[0];
}

function isExternal(value) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value);
}

function resolveLocalReference(sourceFile, rawReference) {
  const clean = safeDecode(stripQueryAndFragment(rawReference.trim()));
  if (!clean) return null;
  const destination = clean.startsWith('/')
    ? resolve(root, `.${clean}`)
    : resolve(dirname(sourceFile), clean);
  const relativeDestination = relative(root, destination);
  if (
    relativeDestination === '..'
    || relativeDestination.startsWith(`..${sep}`)
  ) {
    report(failures, sourceFile, `reference escapes the repository: ${rawReference}`);
    return null;
  }
  return destination;
}

function getIds(html) {
  return [...html.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)].map((match) => match[2]);
}

function checkHtmlFile(file) {
  const html = readFileSync(file, 'utf8');
  const ids = getIds(html);
  const idSet = new Set();

  for (const id of ids) {
    if (idSet.has(id)) report(failures, file, `duplicate id "${id}"`);
    idSet.add(id);
  }

  if (!/<html\b[^>]*\blang\s*=\s*["'][^"']+["']/i.test(html)) {
    report(failures, file, 'the html element needs a language');
  }
  if (!/<meta\b[^>]*\bname\s*=\s*["']viewport["']/i.test(html)) {
    report(failures, file, 'missing viewport metadata');
  }
  if (!/<meta\b[^>]*\bname\s*=\s*["']description["']/i.test(html)) {
    report(failures, file, 'missing page description metadata');
  }
  if ((html.match(/<main\b/gi) ?? []).length !== 1) {
    report(failures, file, 'expected exactly one main element');
  }
  if ((html.match(/<h1\b/gi) ?? []).length !== 1) {
    report(failures, file, 'expected exactly one h1');
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt\s*=\s*(["']).*?\1/i.test(match[0])) {
      report(failures, file, `image is missing alt text: ${match[0]}`);
    }
  }

  for (const match of html.matchAll(/<button\b[^>]*>/gi)) {
    if (!/\btype\s*=\s*["'](?:button|submit|reset)["']/i.test(match[0])) {
      report(failures, file, `button needs an explicit type: ${match[0]}`);
    }
  }

  const headingLevels = [...html.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
  for (let index = 1; index < headingLevels.length; index += 1) {
    if (headingLevels[index] > headingLevels[index - 1] + 1) {
      report(
        failures,
        file,
        `heading level jumps from h${headingLevels[index - 1]} to h${headingLevels[index]}`,
      );
    }
  }

  for (const match of html.matchAll(/\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi)) {
    const reference = match[2].trim();
    if (!reference) {
      report(failures, file, 'empty href or src attribute');
      continue;
    }
    if (isExternal(reference)) continue;

    const [pathPart, rawFragment] = reference.split('#', 2);
    const destination = resolveLocalReference(file, reference);
    if (destination && !existsSync(destination)) {
      report(failures, file, `missing local asset or page: ${reference}`);
      continue;
    }

    if (rawFragment !== undefined) {
      const fragment = safeDecode(rawFragment);
      if (!fragment) {
        report(failures, file, `empty fragment link: ${reference}`);
        continue;
      }
      const targetFile = pathPart
        ? destination
        : file;
      if (targetFile && extname(targetFile).toLowerCase() === '.html') {
        const targetIds = new Set(getIds(readFileSync(targetFile, 'utf8')));
        if (!targetIds.has(fragment)) {
          report(failures, file, `fragment target does not exist: ${reference}`);
        }
      }
    }
  }

  for (const match of html.matchAll(/<a\b[^>]*\btarget\s*=\s*["']_blank["'][^>]*>/gi)) {
    if (!/\brel\s*=\s*["'][^"']*\bnoopener\b[^"']*["']/i.test(match[0])) {
      report(failures, file, 'target="_blank" link must include rel="noopener"');
    }
  }
}

function checkCssFile(file) {
  const css = readFileSync(file, 'utf8');
  for (const match of css.matchAll(/url\(\s*(?:(["'])(.*?)\1|([^)"'\s]+))\s*\)/gi)) {
    const reference = (match[2] ?? match[3] ?? '').trim();
    if (!reference || reference.startsWith('#') || isExternal(reference)) continue;
    const destination = resolveLocalReference(file, reference);
    if (destination && !existsSync(destination)) {
      report(failures, file, `missing CSS asset: ${reference}`);
    }
  }
}

function normalisePair(value) {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/gi, ' ')
    .trim()
    .toLocaleLowerCase('en');
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    report(failures, file, `invalid JSON: ${error.message}`);
    return null;
  }
}

function checkEditorialBoundary() {
  const countiesFile = join(root, 'data', 'counties.json');
  if (!existsSync(countiesFile)) {
    report(failures, countiesFile, 'the county editorial dataset is missing');
    return;
  }

  const dataset = readJson(countiesFile);
  if (!dataset || !Array.isArray(dataset.counties)) {
    report(failures, countiesFile, 'expected a counties array');
    return;
  }

  const slugs = new Set();
  const publishedVerifiedPairs = [];

  for (const county of dataset.counties) {
    if (!county.slug || !county.name) {
      report(failures, countiesFile, 'every county needs a name and slug');
      continue;
    }
    if (slugs.has(county.slug)) {
      report(failures, countiesFile, `duplicate county slug "${county.slug}"`);
    }
    slugs.add(county.slug);

    if (county.officialPairingStatus === 'verified') {
      const country = county.officialUmbrellaPairing?.partnerCountry;
      if (!country) {
        report(
          failures,
          countiesFile,
          `verified county "${county.name}" needs a partner country`,
        );
        continue;
      }
      publishedVerifiedPairs.push(
        `${normalisePair(county.name)}::${normalisePair(country)}`,
      );
      if (county.localResearchFocusStatus !== 'unassigned') {
        report(
          failures,
          countiesFile,
          `${county.name}'s local research focus must remain unassigned until reviewed`,
        );
      }
    } else if (county.officialUmbrellaPairing !== null) {
      report(
        failures,
        countiesFile,
        `${county.name} has pairing data without a verified status`,
      );
    }
  }

  if (dataset.counties.length !== 26) {
    report(
      failures,
      countiesFile,
      `expected the declared 26-county scope, found ${dataset.counties.length}`,
    );
  }

  const mapFile = join(root, 'data', 'county-map.json');
  const mapData = existsSync(mapFile) ? readJson(mapFile) : null;
  if (!mapData || !Array.isArray(mapData.counties)) {
    report(failures, mapFile, 'expected a generated counties array');
  } else {
    const mapBySlug = new Map(mapData.counties.map((county) => [county.slug, county]));
    if (mapBySlug.size !== dataset.counties.length) {
      report(
        failures,
        mapFile,
        'generated map county count does not match the editorial dataset',
      );
    }
    for (const county of dataset.counties) {
      const mapCounty = mapBySlug.get(county.slug);
      if (!mapCounty) {
        report(failures, mapFile, `generated map is missing "${county.slug}"`);
        continue;
      }
      if (
        mapCounty.name !== county.name
      ) {
        report(
          failures,
          mapFile,
          `generated map metadata is stale for "${county.slug}"`,
        );
      }
      if (
        typeof mapCounty.mapPath !== 'string'
        || mapCounty.mapPath.length === 0
        || !Array.isArray(mapCounty.centroid)
        || mapCounty.centroid.length !== 2
        || mapCounty.centroid.some((coordinate) => !Number.isFinite(coordinate))
      ) {
        report(failures, mapFile, `invalid geometry for "${county.slug}"`);
      }
    }
    if (
      !/^https:\/\//i.test(mapData.source?.url ?? '')
      || !mapData.source?.licence
      || !mapData.source?.publisher
    ) {
      report(failures, mapFile, 'map geometry needs source, publisher and licence metadata');
    }
  }

  for (const pair of publishedVerifiedPairs) {
    if (!verifiedPairings.has(pair)) {
      report(
        failures,
        countiesFile,
        `pairing "${pair}" is marked Verified but is not in the editorial allow-list`,
      );
    }
  }

  for (const pair of verifiedPairings) {
    if (!publishedVerifiedPairs.includes(pair)) {
      report(failures, countiesFile, `approved pairing "${pair}" is not verified in data`);
    }
  }

  for (const county of dataset.counties.filter((item) => item.pairingSlug)) {
    const pairingFile = join(root, 'data', 'pairings', `${county.pairingSlug}.json`);
    if (!existsSync(pairingFile)) {
      report(failures, countiesFile, `missing pairing record: ${county.pairingSlug}.json`);
      continue;
    }
    const pairing = readJson(pairingFile);
    if (!pairing) continue;

    const pairKey =
      `${normalisePair(pairing.officialUmbrellaPairing?.irishCounty?.name ?? '')}`
      + `::${normalisePair(pairing.officialUmbrellaPairing?.partnerCountry?.name ?? '')}`;
    if (!verifiedPairings.has(pairKey)) {
      report(
        failures,
        pairingFile,
        `official pairing "${pairKey}" is not in the editorial allow-list`,
      );
    }
    if (
      pairing.status?.localResearchFocus !== 'unassigned'
      || pairing.localResearchFocus?.status !== 'unassigned'
      || pairing.localResearchFocus?.place !== null
    ) {
      report(
        failures,
        pairingFile,
        'no French locality may be assigned without a reviewed editorial change',
      );
    }

    const huguenotLead = pairing.stories?.find(
      (story) => story.id === 'cork-huguenot-history',
    );
    if (
      !huguenotLead
      || huguenotLead.status !== 'research-lead'
      || !/not presented as the official reason/i.test(huguenotLead.claimBoundary ?? '')
    ) {
      report(
        failures,
        pairingFile,
        'the Huguenot item must remain a research lead with a non-rationale boundary',
      );
    }

    const sourceIds = new Set((pairing.sources ?? []).map((source) => source.id));
    for (const sourceRef of pairing.officialUmbrellaPairing?.sourceRefs ?? []) {
      if (!sourceIds.has(sourceRef)) {
        report(failures, pairingFile, `unresolved official source reference "${sourceRef}"`);
      }
    }
  }
}

const files = walk(root);
const htmlFiles = files.filter((file) => extname(file).toLowerCase() === '.html');
const cssFiles = files.filter((file) => extname(file).toLowerCase() === '.css');
const jsonFiles = files.filter((file) => extname(file).toLowerCase() === '.json');

if (htmlFiles.length === 0) {
  report(failures, root, 'no HTML files found');
}

for (const file of htmlFiles) checkHtmlFile(file);
for (const file of cssFiles) checkCssFile(file);
for (const file of jsonFiles) readJson(file);

const indexFile = join(root, 'index.html');
if (existsSync(indexFile) && statSync(indexFile).isFile()) {
  checkEditorialBoundary();
} else {
  report(failures, root, 'index.html is missing');
}

for (const warning of warnings) console.warn(`WARNING ${warning}`);

if (failures.length > 0) {
  console.error(`\nQuality validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `Quality validation passed: ${htmlFiles.length} HTML file(s), `
      + `${cssFiles.length} CSS file(s), ${verifiedPairings.size} verified pairing(s).`,
  );
}
