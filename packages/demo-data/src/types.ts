/**
 * The types now live with the client that produces them.
 *
 * They moved to `@kypstamping/api` when the accessors did: they describe what
 * the API returns, and keeping them next to `endpoints.ts` is what lets that
 * module — and the contract tests that call the real service — load without
 * dragging the fixture JSON along.
 *
 * This re-export exists so the thirteen components that import shapes from
 * `@kypstamping/demo-data` keep compiling while they migrate to the hooks.
 * It goes away with the last of them.
 */

export * from "@kypstamping/api/types";
