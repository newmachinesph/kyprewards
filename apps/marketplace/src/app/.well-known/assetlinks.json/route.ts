import { NextResponse } from "next/server";

/**
 * Android App Links for `kyp.ph/shops/<slug>`: a shop link opens the
 * installed KYP app on its shop screen instead of the browser
 * (`apps/mobile/app.json`, `android.intentFilters`). Same statement as
 * app.kyp.ph's, from the same `ANDROID_CERT_SHA256`.
 *
 * `ANDROID_CERT_SHA256` lists the SHA-256 fingerprints, comma-separated, of
 * every certificate an installed app can be signed with. An install from
 * Google Play carries Google's app signing key (Play Console, Test and
 * release > App integrity > App signing), not the EAS upload key, so that
 * one must be listed; add the upload key too only if builds are installed
 * outside Play. Until one is set this answers 404: a statement naming the
 * wrong certificate is worse than none, because Android verifies it once at
 * install time and a failed verification sticks until the app is reinstalled.
 */
export function GET() {
  const fingerprints = (process.env.ANDROID_CERT_SHA256 ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
  if (fingerprints.length === 0) return new NextResponse(null, { status: 404 });
  return NextResponse.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "ph.kyp.wallet",
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]);
}
