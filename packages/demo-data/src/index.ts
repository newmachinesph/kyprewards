import demoData from "./kypstamping-demo.json";

export { demoData };
export type DemoData = typeof demoData;

/** Narrowed views of the same fixture, plus the async accessors the stores
 *  hydrate through. See `api.ts` — that file is the swap point for the real
 *  service, and `types.ts` is the contract it has to satisfy. */
export * from "./types";
export * from "./api";
