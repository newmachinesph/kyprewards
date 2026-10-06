/**
 * The two Sentry calls the apps make, and nothing else.
 *
 * Imported lazily by `sentry.ts` and each app's `instrumentation-client.ts`.
 * A dynamic `import("@sentry/nextjs")` takes the whole namespace, which a
 * bundler cannot tree-shake: Session Replay and every integration came along,
 * about 176 KB gzipped on the first page view. Named imports here let it drop
 * everything the apps never call.
 */
export { captureException, init } from "@sentry/nextjs";
