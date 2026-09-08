# Credentials

Everything in this directory is gitignored, including this note's neighbours.

Put the **FCM V1 service account key** here — the JSON from Firebase console
→ Project settings → Service accounts → Generate new private key. Any
filename; the directory is what is ignored, not the name.

It is uploaded to EAS with `eas credentials` and lives on Expo's servers
after that. It never belongs in git: it is a private key with admin rights
over push for the whole Firebase project.

`google-services.json` does **not** go here. It is not secret, it ships
inside the APK, and EAS Build needs it in the tree — it sits at
`apps/mobile/google-services.json`.
