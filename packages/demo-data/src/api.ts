/**
 * The one visit all four apps narrate.
 *
 * Everything else this package exported has moved. The accessors are
 * `endpoints.ts` in `@kyprewards/api`, calling the real service; the types
 * are beside them; the synchronous mirrors the components used to read are
 * gone with the components that read them.
 *
 * `sharedScenario` stays because it is a demo device rather than data: one
 * ₱286 purchase at Sweet Crumbs Kapitolyo that the merchant workspace, the
 * customer wallet and the platform console each show from their own side. The
 * API has no route for it and should not - it is the story, not the record.
 */

import demoData from "./kyprewards-demo.json";
import type { SharedScenario } from "@kyprewards/api/types";

export const sharedScenario = demoData.sharedScenario as SharedScenario;
