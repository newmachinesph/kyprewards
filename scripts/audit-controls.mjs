import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const appsDirectory = path.join(root, "apps");
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".next" || entry.name === "node_modules") continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (/\.(tsx|jsx)$/.test(entry.name)) files.push(target);
  }
}

walk(appsDirectory);

/**
 * Every route each app can actually serve.
 *
 * The audit previously checked only that a link *had* an href, which is how
 * two homepage CTAs kept pointing at a `/demo` route that had been deleted.
 * A destination that 404s is a broken control, so it is checked here too.
 */
function routesFor(appDirectory) {
  const routes = new Set();
  const appRoot = path.join(appDirectory, "src", "app");
  if (!fs.existsSync(appRoot)) return routes;

  function collect(directory, urlPath) {
    if (fs.existsSync(path.join(directory, "page.tsx"))) {
      routes.add(urlPath || "/");
    }
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const segment = entry.name;
      // Route groups do not appear in the URL.
      const nextPath = segment.startsWith("(")
        ? urlPath
        : `${urlPath}/${segment}`;
      collect(path.join(directory, segment), nextPath);
    }
  }

  collect(appRoot, "");
  return routes;
}

const routesByApp = new Map(
  fs
    .readdirSync(appsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [
      entry.name,
      routesFor(path.join(appsDirectory, entry.name)),
    ]),
);

/** Does `href` match a route, allowing for `[slug]` segments? */
function resolves(routes, href) {
  const target = href.split("#")[0].split("?")[0].replace(/\/$/, "") || "/";
  for (const route of routes) {
    const pattern = new RegExp(
      `^${route.replace(/\[[^\]]+\]/g, "[^/]+")}$`,
    );
    if (pattern.test(target)) return true;
  }
  return false;
}

const findings = [];

/** `apps/marketing-site/src/...` -> `marketing-site`, on either separator. */
function appOf(relativePath) {
  return relativePath.split(path.sep).join("/").split("/")[1] ?? "";
}

function attributesOf(node) {
  return new Map(
    node.attributes.properties
      .filter(ts.isJsxAttribute)
      .map((attribute) => [attribute.name.text.toString(), attribute]),
  );
}

for (const file of files) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  function inspect(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      const attributes = attributesOf(node);
      const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      const relative = path.relative(root, file);

      if (/^(button|Button|IconButton|Chip)$/.test(tag)) {
        // `onPress` is React Native's `onClick`: the mobile app's buttons
        // are held to the same rule with the prop the platform gives them.
        const click = attributes.get("onClick") ?? attributes.get("onPress");
        const type = attributes.get("type")?.initializer?.getText(source) ?? "";
        const submitsForm = /submit|reset/.test(type);
        if (!click && !submitsForm) {
          findings.push(`${relative}:${line} ${tag} has no action or form type`);
        }
        // Exactly `onClick={undefined}` - a substring test also flagged
        // legitimate calls like `mutate(undefined, {...})` and `x || undefined`.
        if (/^\{\s*undefined\s*\}$/.test(click?.initializer?.getText(source) ?? "")) {
          findings.push(`${relative}:${line} ${tag} has an undefined action`);
        }
      }

      const href = attributes.get("href")?.initializer?.getText(source) ?? "";

      if (tag === "a" || tag === "Link") {
        if (!href) findings.push(`${relative}:${line} ${tag} has no href`);
        if (/^["']#(["'])?$/.test(href) || /javascript:/i.test(href)) {
          findings.push(`${relative}:${line} ${tag} uses a placeholder href`);
        }
      }

      // Any element carrying an href, not just `a` and `Link`. The dead
      // `/demo` links this check was added for lived on a `SiteButton`.
      // Only plain string literals resolve statically; template literals point
      // at another app's origin and are out of scope here.
      const literal = /^["'](\/[^"']*)["']$/.exec(href);
      if (literal) {
        const routes = routesByApp.get(appOf(relative));
        if (routes && routes.size && !resolves(routes, literal[1])) {
          findings.push(
            `${relative}:${line} ${tag} links to ${literal[1]}, which is not a route in this app`,
          );
        }
      }
    }
    ts.forEachChild(node, inspect);
  }

  inspect(source);
}

if (findings.length) {
  console.error(`Control audit failed with ${findings.length} finding(s):`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  const routeCount = [...routesByApp.values()].reduce(
    (sum, routes) => sum + routes.size,
    0,
  );
  console.log(
    `Control audit passed across ${files.length} frontend source files and ${routeCount} routes.`,
  );
}
