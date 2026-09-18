"""Photographic backdrops for the store graphics, generated with Gemini 2.5
Flash Image on Vertex AI through Application Default Credentials.

    python apps/mobile/store/imagery.py        (from frontend/)

Needs `gcloud auth application-default login`; the quota project is read
from the ADC file. No text, logos or legible screens are asked for: the
graphics set their own type over these.
"""

import base64
import json
import pathlib
import subprocess
import urllib.request

OUT = pathlib.Path(__file__).parent / "imagery"
PROJECT = "project-2f346af6-de69-4060-a90"
MODEL = "gemini-2.5-flash-image"
STYLE = (
    " Candid documentary photograph, natural warm light, shallow depth of field, "
    "palette of warm amber, honey, cream and deep espresso brown. A clean photograph "
    "with plain unlettered surfaces and no visible writing anywhere."
)
SHOTS = {
    "counter": (
        "16:9",
        "A small independent coffee counter in Manila in late afternoon: a wooden counter "
        "with a glass jar of pastries and an espresso machine softly blurred behind, a "
        "customer's hand resting a smartphone on the counter, screen facing away.",
    ),
    "pastries": (
        "9:16",
        "Overhead view of Filipino bakery breads - pandesal, ensaymada and spanish bread - "
        "on brown kraft paper on a rustic wooden table, generous empty space in the upper "
        "half of the frame.",
    ),
    "street": (
        "9:16",
        "A quiet neighbourhood street in Quezon City at dusk lined with small family-run "
        "shops, a sari-sari store window and a bakery glowing warmly, string lights, soft "
        "bokeh, no people in focus, generous dark sky in the upper half of the frame.",
    ),
}


def token() -> str:
    return subprocess.run(
        "gcloud auth application-default print-access-token",
        shell=True, capture_output=True, text=True, check=True,
    ).stdout.strip()


def generate(name: str, aspect: str, prompt: str) -> None:
    url = (
        f"https://aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/global/"
        f"publishers/google/models/{MODEL}:generateContent"
    )
    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt + STYLE}]}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": aspect}},
    }
    request = urllib.request.Request(
        url, data=json.dumps(body).encode(), method="POST",
        headers={"Authorization": f"Bearer {token()}", "x-goog-user-project": PROJECT,
                 "Content-Type": "application/json"},
    )
    answer = json.load(urllib.request.urlopen(request, timeout=180))
    if "candidates" not in answer:
        raise RuntimeError(f"{name}: {json.dumps(answer)[:400]}")
    for part in answer["candidates"][0]["content"]["parts"]:
        if "inlineData" in part:
            path = OUT / f"{name}.png"
            path.write_bytes(base64.b64decode(part["inlineData"]["data"]))
            print("wrote", path)
            return
    raise RuntimeError(f"{name}: no image in the answer: {json.dumps(answer)[:300]}")


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for name, (aspect, prompt) in SHOTS.items():
        generate(name, aspect, prompt)
