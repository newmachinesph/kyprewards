import { NextResponse } from "next/server";

/**
 * iOS universal links for `app.kyp.ph` (`apps/mobile/app.json`,
 * `ios.associatedDomains`). Apple fetches this once per install and needs
 * it served as JSON with no extension.
 *
 * The app ID is the Apple Team ID plus the bundle identifier, and there is
 * no Apple Developer account yet (`docs/MOBILE.md`, phase 5). Until
 * `APPLE_TEAM_ID` is set this answers 404 rather than a made-up ID.
 */
export function GET() {
  const team = process.env.APPLE_TEAM_ID?.trim();
  if (!team) return new NextResponse(null, { status: 404 });
  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: [{ appID: `${team}.ph.kyp.wallet`, paths: ["/join/*", "/login"] }],
      },
    },
    { headers: { "Content-Type": "application/json" } },
  );
}
