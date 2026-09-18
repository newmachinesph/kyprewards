"""Fill the App Store Connect listing from listing.json and the screenshots.

    ASC_ISSUER_ID=... python apps/mobile/store/appstore.py     (from frontend/)

Uses the team API key in credentials/AuthKey_<KEY_ID>.p8. Safe to run
again: text fields are overwritten and each screenshot set is emptied
before its images are uploaded. What the API cannot set (App Privacy,
price and availability, review contact) is left for the console; see
README.md.
"""

import base64
import glob
import hashlib
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.request

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature

HERE = pathlib.Path(__file__).parent
APP_ID = "6813543606"
KEY_ID = "XPCK8DYVRL"
LOCALE = "en-US"
API = "https://api.appstoreconnect.apple.com"
# 6.9" screenshots (1320 x 2868) go in the 6.7" slot, which Apple uses for
# the largest iPhones; 6.5" is optional when these exist.
SHOT_SETS = {
    "APP_IPHONE_67": "ios/iphone-6.9-*.png",
    "APP_IPHONE_65": "ios/iphone-6.5-*.png",
}


def _b64(raw: bytes) -> bytes:
    return base64.urlsafe_b64encode(raw).rstrip(b"=")


def token(issuer: str) -> str:
    key = serialization.load_pem_private_key(
        (HERE.parent / "credentials" / f"AuthKey_{KEY_ID}.p8").read_bytes(), None
    )
    now = int(time.time())
    head = _b64(json.dumps({"alg": "ES256", "kid": KEY_ID, "typ": "JWT"}).encode())
    body = _b64(
        json.dumps(
            {"iss": issuer, "iat": now, "exp": now + 1100, "aud": "appstoreconnect-v1"}
        ).encode()
    )
    r, s = decode_dss_signature(key.sign(head + b"." + body, ec.ECDSA(hashes.SHA256())))
    return (head + b"." + body + b"." + _b64(r.to_bytes(32, "big") + s.to_bytes(32, "big"))).decode()


class Api:
    def __init__(self, issuer: str) -> None:
        self.auth = "Bearer " + token(issuer)

    def call(self, method: str, path: str, body: dict | None = None) -> dict:
        request = urllib.request.Request(
            path if path.startswith("http") else API + path,
            data=json.dumps(body).encode() if body is not None else None,
            method=method,
            headers={"Authorization": self.auth, "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(request) as answer:
                raw = answer.read()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as failure:
            detail = failure.read().decode(errors="replace")
            raise RuntimeError(f"{method} {path}: {failure.code} {detail[:600]}") from None

    def patch(self, kind: str, ident: str, attributes: dict | None = None, relationships: dict | None = None) -> dict:
        data: dict = {"type": kind, "id": ident}
        if attributes:
            data["attributes"] = attributes
        if relationships:
            data["relationships"] = relationships
        return self.call("PATCH", f"/v1/{kind}/{ident}", {"data": data})


def localisation(api: Api, path: str) -> dict:
    rows = api.call("GET", path)["data"]
    found = [row for row in rows if row["attributes"]["locale"] == LOCALE]
    if not found:
        raise RuntimeError(f"no {LOCALE} localisation at {path}; set the primary language to English (U.S.)")
    return found[0]


def age_rating(api: Api, info_id: str) -> None:
    declaration = api.call("GET", f"/v1/appInfos/{info_id}/ageRatingDeclaration")["data"]
    none = "NONE"
    wanted = {
        "alcoholTobaccoOrDrugUseOrReferences": none, "contests": none, "gamblingSimulated": none,
        "gunsOrOtherWeapons": none, "horrorOrFearThemes": none, "matureOrSuggestiveThemes": none,
        "medicalOrTreatmentInformation": none, "profanityOrCrudeHumor": none,
        "sexualContentGraphicAndNudity": none, "sexualContentOrNudity": none,
        "violenceCartoonOrFantasy": none, "violenceRealistic": none,
        "violenceRealisticProlongedGraphicOrSadistic": none,
        "gambling": False, "lootBox": False, "unrestrictedWebAccess": False,
        "messagingAndChat": False, "userGeneratedContent": False, "advertising": False,
        "healthOrWellnessTopics": False, "parentalControls": False, "ageAssurance": False,
    }
    # Apple renames and adds questions; send only what this declaration has.
    known = declaration.get("attributes", {})
    api.patch("ageRatingDeclarations", declaration["id"], {k: v for k, v in wanted.items() if k in known})


def screenshots(api: Api, localisation_id: str) -> None:
    sets = api.call("GET", f"/v1/appStoreVersionLocalizations/{localisation_id}/appScreenshotSets")["data"]
    for display, pattern in SHOT_SETS.items():
        existing = [s for s in sets if s["attributes"]["screenshotDisplayType"] == display]
        if existing:
            set_id = existing[0]["id"]
            for old in api.call("GET", f"/v1/appScreenshotSets/{set_id}/appScreenshots")["data"]:
                api.call("DELETE", f"/v1/appScreenshots/{old['id']}")
        else:
            set_id = api.call("POST", "/v1/appScreenshotSets", {"data": {
                "type": "appScreenshotSets",
                "attributes": {"screenshotDisplayType": display},
                "relationships": {"appStoreVersionLocalization": {"data": {
                    "type": "appStoreVersionLocalizations", "id": localisation_id}}},
            }})["data"]["id"]
        for file in sorted(glob.glob(str(HERE / pattern))):
            raw = pathlib.Path(file).read_bytes()
            shot = api.call("POST", "/v1/appScreenshots", {"data": {
                "type": "appScreenshots",
                "attributes": {"fileName": pathlib.Path(file).name, "fileSize": len(raw)},
                "relationships": {"appScreenshotSet": {"data": {"type": "appScreenshotSets", "id": set_id}}},
            }})["data"]
            for op in shot["attributes"]["uploadOperations"]:
                part = urllib.request.Request(
                    op["url"], data=raw[op["offset"]: op["offset"] + op["length"]], method=op["method"],
                    headers={h["name"]: h["value"] for h in op["requestHeaders"]},
                )
                urllib.request.urlopen(part).read()
            api.patch("appScreenshots", shot["id"], {
                "uploaded": True, "sourceFileChecksum": hashlib.md5(raw).hexdigest()})
            print("  uploaded", display, pathlib.Path(file).name)


def main() -> None:
    issuer = os.environ.get("ASC_ISSUER_ID", "").strip()
    if not issuer:
        sys.exit("Set ASC_ISSUER_ID (App Store Connect > Users and Access > Integrations).")
    listing = json.loads((HERE / "listing.json").read_text(encoding="utf-8"))
    api = Api(issuer)

    app = api.call("GET", f"/v1/apps/{APP_ID}")["data"]
    print("app:", app["attributes"]["name"], app["attributes"]["bundleId"])
    # Shops' names and storefront photos appear in the app, used under the
    # merchant terms: third-party content the publisher has rights to.
    api.patch("apps", APP_ID, {"contentRightsDeclaration": "USES_THIRD_PARTY_CONTENT"})

    infos = api.call("GET", f"/v1/apps/{APP_ID}/appInfos")["data"]
    info = next((i for i in infos if i["attributes"].get("state") != "READY_FOR_DISTRIBUTION"), infos[0])
    api.patch("appInfos", info["id"], relationships={
        "primaryCategory": {"data": {"type": "appCategories", "id": listing["primaryCategory"]}},
        "secondaryCategory": {"data": {"type": "appCategories", "id": listing["secondaryCategory"]}},
    })
    info_loc = localisation(api, f"/v1/appInfos/{info['id']}/appInfoLocalizations")
    api.patch("appInfoLocalizations", info_loc["id"], {
        "name": listing["name"], "subtitle": listing["subtitle"],
        "privacyPolicyUrl": listing["privacyPolicyUrl"]})
    print("app info: name, subtitle, privacy URL, categories")
    age_rating(api, info["id"])
    print("age rating: every content question answered none")

    versions = api.call("GET", f"/v1/apps/{APP_ID}/appStoreVersions?filter[platform]=IOS")["data"]
    editable = [v for v in versions if v["attributes"]["appStoreState"] in (
        "PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED")]
    if not editable:
        sys.exit("No editable iOS version; add one in App Store Connect first.")
    version = editable[0]
    api.patch("appStoreVersions", version["id"], {"copyright": listing["copyright"]})
    ver_loc = localisation(api, f"/v1/appStoreVersions/{version['id']}/appStoreVersionLocalizations")
    api.patch("appStoreVersionLocalizations", ver_loc["id"], {
        "description": listing["description"], "keywords": listing["keywords"],
        "promotionalText": listing["promotionalText"], "supportUrl": listing["supportUrl"],
        "marketingUrl": listing["marketingUrl"]})
    print(f"version {version['attributes']['versionString']}: description, keywords, promo text, URLs, copyright")
    screenshots(api, ver_loc["id"])
    print("done")


if __name__ == "__main__":
    main()
