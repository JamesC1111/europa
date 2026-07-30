import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const inputPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(projectRoot, "work", "counties-generalised.geojson");
const outputPath = path.join(projectRoot, "data", "county-map.json");
const countiesPath = path.join(projectRoot, "data", "counties.json");

if (!fs.existsSync(inputPath)) {
  throw new Error(
    `Boundary source not found at ${inputPath}. Download the official Tailte Éireann GeoJSON described in data/README.md first.`,
  );
}

const geojson = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const editorial = JSON.parse(fs.readFileSync(countiesPath, "utf8"));
const editorialByName = new Map(
  editorial.counties.map((county) => [county.name.toUpperCase(), county]),
);

function polygonsFor(feature) {
  if (feature.geometry.type === "Polygon") {
    return [feature.geometry.coordinates];
  }
  if (feature.geometry.type === "MultiPolygon") {
    return feature.geometry.coordinates;
  }
  throw new Error(`Unsupported geometry type: ${feature.geometry.type}`);
}

const coordinates = [];
for (const feature of geojson.features) {
  for (const polygon of polygonsFor(feature)) {
    for (const ring of polygon) {
      coordinates.push(...ring);
    }
  }
}

const bounds = coordinates.reduce(
  (result, [x, y]) => ({
    minX: Math.min(result.minX, x),
    maxX: Math.max(result.maxX, x),
    minY: Math.min(result.minY, y),
    maxY: Math.max(result.maxY, y),
  }),
  {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  },
);

const viewBox = { width: 620, height: 760, padding: 24 };
const scale = Math.min(
  (viewBox.width - viewBox.padding * 2) / (bounds.maxX - bounds.minX),
  (viewBox.height - viewBox.padding * 2) / (bounds.maxY - bounds.minY),
);
const offsetX =
  (viewBox.width - (bounds.maxX - bounds.minX) * scale) / 2;
const offsetY =
  (viewBox.height - (bounds.maxY - bounds.minY) * scale) / 2;

function project([x, y]) {
  return [
    (offsetX + (x - bounds.minX) * scale).toFixed(1),
    (offsetY + (bounds.maxY - y) * scale).toFixed(1),
  ];
}

function squareDistance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function segmentDistance(point, start, end) {
  let x = start[0];
  let y = start[1];
  let dx = end[0] - x;
  let dy = end[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t =
      ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = end[0];
      y = end[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
}

function simplifyRadial(points, toleranceSquared) {
  let previous = points[0];
  const simplified = [previous];
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    if (squareDistance(point, previous) > toleranceSquared) {
      simplified.push(point);
      previous = point;
    }
  }
  if (previous !== points.at(-1)) simplified.push(points.at(-1));
  return simplified;
}

function simplifyDouglasPeucker(points, toleranceSquared) {
  const markers = new Uint8Array(points.length);
  const stack = [[0, points.length - 1]];
  markers[0] = 1;
  markers[points.length - 1] = 1;

  while (stack.length) {
    const [first, last] = stack.pop();
    let maxDistance = toleranceSquared;
    let index = 0;
    for (let cursor = first + 1; cursor < last; cursor += 1) {
      const distance = segmentDistance(
        points[cursor],
        points[first],
        points[last],
      );
      if (distance > maxDistance) {
        index = cursor;
        maxDistance = distance;
      }
    }
    if (maxDistance > toleranceSquared) {
      markers[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }

  return points.filter((_, index) => markers[index]);
}

function simplifyRing(ring, tolerance = 900) {
  const isClosed =
    ring.length > 2 &&
    ring[0][0] === ring.at(-1)[0] &&
    ring[0][1] === ring.at(-1)[1];
  const open = isClosed ? ring.slice(0, -1) : ring.slice();
  if (open.length <= 4) return ring;
  const toleranceSquared = tolerance * tolerance;
  const radial = simplifyRadial(open, toleranceSquared);
  const simplified = simplifyDouglasPeucker(radial, toleranceSquared);
  if (simplified.length < 3) return ring;
  return [...simplified, simplified[0]];
}

function ringPath(ring) {
  const projected = simplifyRing(ring).map(project);
  if (projected.length < 4) return "";
  const ringBounds = projected.reduce(
    (result, [x, y]) => ({
      minX: Math.min(result.minX, Number(x)),
      maxX: Math.max(result.maxX, Number(x)),
      minY: Math.min(result.minY, Number(y)),
      maxY: Math.max(result.maxY, Number(y)),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );
  if (
    ringBounds.maxX - ringBounds.minX < 1.5 &&
    ringBounds.maxY - ringBounds.minY < 1.5
  ) {
    return "";
  }
  return `${projected
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`)
    .join(" ")}Z`;
}

const counties = geojson.features
  .map((feature) => {
    const name = feature.properties.ENGLISH;
    const editorialCounty = editorialByName.get(name.toUpperCase());
    if (!editorialCounty) {
      throw new Error(`No editorial county record found for ${name}.`);
    }
    const pathData = polygonsFor(feature)
      .flatMap((polygon) => polygon.map(ringPath))
      .filter(Boolean)
      .join(" ");
    const centroid = project([
      Number(feature.properties.CENTROID_X),
      Number(feature.properties.CENTROID_Y),
    ]);
    return {
      ...editorialCounty,
      irishName: feature.properties.GAEILGE,
      mapPath: pathData,
      centroid: centroid.map(Number),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "en-IE"));

if (counties.length !== 26) {
  throw new Error(`Expected 26 county features; received ${counties.length}.`);
}

const output = {
  schemaVersion: "1.0.0",
  viewBox: `0 0 ${viewBox.width} ${viewBox.height}`,
  scope:
    "The 26 traditional counties in the Republic of Ireland used by the 2026 EU County Pairings initiative.",
  source: {
    title: "Counties - National Statutory Boundaries - 2019 - Generalised 20m",
    publisher: "Tailte Éireann",
    licence: "Creative Commons Attribution 4.0",
    url: "https://data.gov.ie/dataset/counties-national-statutory-boundaries-2019-generalised-20m1",
    note: "Geometry is web-simplified and scaled from Irish Transverse Mercator coordinates; it is illustrative, not a legal boundary record.",
  },
  counties,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output)}\n`, "utf8");
console.log(`Wrote ${counties.length} counties to ${outputPath}`);
