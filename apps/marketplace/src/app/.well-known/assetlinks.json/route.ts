import { NextResponse } from "next/server";

/**
 * Android App Links for `kyp.ph/shops/<slug>`: a shop link opens the
 * installed KYP app on its shop screen instead of the browser
 * (`apps/mobile/app.json`, `android.intentFilters`).
 *
 * The statement names the release signing certificate, which EAS Build
 * creates on the first Android build. Until its SHA-256 fingerprint is set
 * as `ANDROID_CERT_SHA256` this answers 404: a statement naming the wrong
 * certificate is worse than none, because Android verifies it once at
 * install time and a failed verification sticks until the app is
 * reinstalled.
 */
export function GET() {
  const fingerprint = process.env.ANDROID_CERT_SHA256?.trim();
  if (!fingerprint) return new NextResponse(null, { status: 404 });
  return NextResponse.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "ph.kyp.wallet",
        sha256_cert_fingerprints: [fingerprint],
      },
    },
  ]);
}
