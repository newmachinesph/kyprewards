import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      next: {
        rootDir: [
          "apps/business-web/",
          "apps/admin-web/",
          "apps/customer-pwa/",
          "apps/marketing-site/",
          "apps/marketplace/",
        ],
      },
    },
  },
    // The mobile app is React Native, not Next; it lints with `expo lint` from
  // its own directory. Next's rules would flag every screen in it.
  globalIgnores(["**/.next/**", "**/node_modules/**", "**/next-env.d.ts", "apps/mobile/**"]),
]);
