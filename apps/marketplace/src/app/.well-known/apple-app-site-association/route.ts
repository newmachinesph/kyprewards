import { NextResponse } from "next/server";

/**
 * iOS universal links for `kyp.ph/shops/<slug>` (`apps/mobile/app.json`,
 * `ios.associatedDomains`). Served as JSON with no extension, as Apple
 * requires; 404 until an Apple Team ID exists (`docs/MOBILE.md`, phase 5).
 */
export function GET() {
  const team = process.env.APPLE_TEAM_ID?.trim();
  if (!team) return new NextResponse(null, { status: 404 });
  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: [{ appID: `${team}.ph.kyp.wallet`, paths: ["/shops/*"] }],
      },
    },
    { headers: { "Content-Type": "application/json" } },
  );
}
