// Runs after each web app's build (`postbuild`), from that app's folder.
//
// Hostinger builds Next apps as standalone and starts the first server.js it
// finds at the top of .next/standalone. In this monorepo Next nests the app's
// server under apps/<app>/, so the first one found is react-dom's and the site
// answers 503. This adds a top-level server.js that starts the app's own, and
// copies in the static files a standalone server does not trace.
//
// Builds that are not standalone (Vercel, local) are left alone.
import { cpSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";

const app = process.cwd();
const standalone = path.join(app, ".next", "standalone");
if (!existsSync(standalone)) process.exit(0);

const relative = path.relative(path.resolve(app, "..", ".."), app).split(path.sep).join("/");
const nested = path.join(standalone, relative);
if (!existsSync(path.join(nested, "server.js"))) {
  throw new Error(`no standalone server at ${nested}`);
}

cpSync(path.join(app, ".next", "static"), path.join(nested, ".next", "static"), { recursive: true });
if (existsSync(path.join(app, "public"))) {
  cpSync(path.join(app, "public"), path.join(nested, "public"), { recursive: true });
}
writeFileSync(path.join(standalone, "server.js"), `require("./${relative}/server.js");\n`);
console.log(`hostinger-standalone: server.js -> ${relative}/server.js`);
