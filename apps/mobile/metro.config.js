/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/**
 * The app lives in an npm workspace beside five Next.js apps and shares
 * `packages/api` with them. Expo's default config finds the workspace root on
 * its own; the two lines below make that explicit so a future Metro cannot
 * quietly stop watching the package the whole app is built on.
 */
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// `packages/api` imports its own files with explicit `.ts` extensions so bare
// Node can run its contract tests; Metro resolves those as-is.
config.resolver.sourceExts = [
  ...new Set([...config.resolver.sourceExts, "ts", "tsx", "mjs"]),
];

// NativeWind 5 compiles global.css (Tailwind v4, the workspace's version)
// inside Metro and gives every React Native primitive a className prop.
module.exports = withNativewind(config);
