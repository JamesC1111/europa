import http from "node:http";
import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(projectRoot, "output", "screenshots");
const host = "127.0.0.1";
const port = 4173;

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
]);

function safeLocalPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, `http://${host}`).pathname);
  const candidate = path.resolve(projectRoot, `.${pathname}`);
  const relative = path.relative(projectRoot, candidate);
  if (relative === ".." || relative.startsWith(`..${path.sep}`)) return null;
  return candidate;
}

const server = http.createServer(async (request, response) => {
  try {
    let file = safeLocalPath(request.url || "/");
    if (!file) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const fileStat = await stat(file).catch(() => null);
    if (fileStat?.isDirectory()) file = path.join(file, "index.html");
    const data = await readFile(file);
    response.writeHead(200, {
      "Content-Type":
        contentTypes.get(path.extname(file).toLowerCase()) ||
        "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

const screens = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "desktop", width: 1440, height: 1000 },
];

const routes = [
  { name: "home", path: "/" },
  { name: "cork-france", path: "/pairings/cork-france/" },
  { name: "contribute", path: "/contribute/" },
];

function formatAxeViolation(violation) {
  const targets = violation.nodes
    .flatMap((node) => node.target)
    .slice(0, 4)
    .join(", ");
  return `${violation.id} (${violation.impact || "unknown"}): ${targets}`;
}

await mkdir(outputDirectory, { recursive: true });
await new Promise((resolve) => server.listen(port, host, resolve));

const browser = await chromium.launch();
const failures = [];

try {
  for (const screen of screens) {
    for (const route of routes) {
      const context = await browser.newContext({
        viewport: { width: screen.width, height: screen.height },
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const runtimeErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") runtimeErrors.push(message.text());
      });
      page.on("pageerror", (error) => runtimeErrors.push(error.message));

      try {
        await page.goto(`http://${host}:${port}${route.path}`, {
          waitUntil: "networkidle",
        });
        await page.locator("main").waitFor();

        const metadata = await page.evaluate(() => ({
          title: document.title,
          canonical: document.querySelector('link[rel="canonical"]')?.href || "",
          ogImage:
            document.querySelector('meta[property="og:image"]')?.content || "",
          overflow:
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        }));
        if (!metadata.title || !metadata.canonical || !metadata.ogImage) {
          failures.push(
            `${route.name}/${screen.name}: title, canonical URL or Open Graph image is missing.`,
          );
        }
        if (metadata.overflow > 1) {
          failures.push(
            `${route.name}/${screen.name}: page overflows horizontally by ${metadata.overflow}px.`,
          );
        }

        const navigationLabels = await page
          .locator(".site-nav a")
          .allTextContents();
        if (!navigationLabels.includes("About") || navigationLabels.some((label) => /cork.*france/i.test(label))) {
          failures.push(
            `${route.name}/${screen.name}: primary navigation must show About and not Cork–France.`,
          );
        }

        if (route.name === "home") {
          await page.locator(".county-shape").first().waitFor();
          const shapes = await page.locator(".county-shape").count();
          if (shapes !== 26) {
            failures.push(
              `home/${screen.name}: expected 26 county shapes, found ${shapes}.`,
            );
          }
          await page.locator('.county-button[data-slug="cork"]').click();
          await page
            .locator("[data-county-result] h3")
            .getByText("Cork × France")
            .waitFor();
          const profileHref = await page
            .locator("[data-county-result] a")
            .getAttribute("href");
          if (!profileHref?.endsWith("pairings/cork-france/")) {
            failures.push(
              `home/${screen.name}: Cork does not expose its permanent profile route.`,
            );
          }
          await page.locator(".europe-connection").waitFor();
          await page
            .getByRole("button", { name: "Back to Ireland" })
            .click();
          await page.locator(".county-map svg").waitFor();
          await page.locator('.county-button[data-slug="clare"]').click();
          await page
            .locator("[data-county-result] h3")
            .getByText("Clare × Croatia")
            .waitFor();
          await page
            .getByText("No contributions have been added to the atlas yet.")
            .waitFor();
        }

        if (route.name === "cork-france" && screen.name === "desktop") {
          await page.locator('input[name="q1"][value="france"]').check();
          await page.locator('input[name="q2"][value="unassigned"]').check();
          await page.locator('input[name="q3"][value="lead"]').check();
          await page.getByRole("button", { name: "Check my answers" }).click();
          await page.getByText("3 out of 3", { exact: false }).waitFor();
        }

        const accessibility = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        for (const violation of accessibility.violations) {
          failures.push(
            `${route.name}/${screen.name}: ${formatAxeViolation(violation)}`,
          );
        }

        if (runtimeErrors.length) {
          for (const error of runtimeErrors) {
            failures.push(`${route.name}/${screen.name}: console error: ${error}`);
          }
        }

        await page.evaluate(() => {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        });
        await page.waitForTimeout(100);
        await page.screenshot({
          path: path.join(outputDirectory, `${route.name}-${screen.name}.png`),
          fullPage: true,
        });
      } catch (error) {
        failures.push(`${route.name}/${screen.name}: ${error.message}`);
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

if (failures.length) {
  console.error(`Browser audit failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `Browser audit passed for ${routes.length} pages at ${screens.length} viewport sizes.`,
  );
  console.log(`Screenshots: ${outputDirectory}`);
}
