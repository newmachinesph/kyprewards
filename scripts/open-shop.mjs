/**
 * How a shop comes to exist, for the suites that need a fresh one.
 *
 * There is no sign-up: a shop applies on kyprewards.com/partners, the platform
 * admin approves it, and approval mails the owner a temporary password. The
 * suites walk exactly that, through the real endpoints, so a fresh shop in a
 * test is the same shape as a fresh shop in production.
 *
 * Each actor is anything with `call(path, { method, body })` answering
 * `{ status, body, text }` - the cookie-jar actor every suite already builds.
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

export const ADMIN_EMAIL = "admin@kyprewards.com";
export const ADMIN_PASSWORD = "DemoPass123!";
export const ADMIN_MFA_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";

/** RFC 6238, 30-second step, six digits. */
export function totp(secret, at = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of secret.replace(/=+$/, "")) {
    bits += alphabet.indexOf(character.toUpperCase()).toString(2).padStart(5, "0");
  }
  const key = Buffer.from((bits.match(/.{8}/g) ?? []).map((byte) => parseInt(byte, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  const digest = createHmac("sha1", key).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

// The API accepts each 30-second step's code once (a replayed code is
// refused), and a script signs the administrator in more than once a minute.
// Every sign-in in this process gets a step nobody here has used yet,
// waiting for the next one when it must.
let lastStep = -1;

export async function freshTotp(secret) {
  let step = Math.floor(Date.now() / 30_000);
  if (step <= lastStep) {
    step = lastStep + 1;
    await new Promise((resolve) => setTimeout(resolve, step * 30_000 - Date.now() + 250));
  }
  lastStep = step;
  return totp(secret, step * 30_000);
}

export async function signInAdmin(admin) {
  const login = await admin.call("/auth/login", {
    method: "POST",
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (login.status !== 200) throw new Error(`admin login: ${login.status} ${login.text.slice(0, 90)}`);
  const verified = await admin.call("/auth/mfa/verify", {
    method: "POST",
    body: { code: await freshTotp(ADMIN_MFA_SECRET) },
  });
  if (verified.status !== 200) throw new Error(`admin mfa: ${verified.status}`);
}

/** Waits out a 429 rather than failing on it: the limits are real. */
async function patiently(send) {
  let answer = await send();
  for (let attempt = 0; answer.status === 429 && attempt < 6; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 4000 * (attempt + 1)));
    answer = await send();
  }
  return answer;
}

/**
 * Apply, approve, sign in with the mailed password. `admin` must already be
 * signed in; `merchant` ends signed in to the new workspace.
 */
export async function openApprovedShop({
  admin,
  merchant,
  name,
  email,
  ownerName = "Test Owner",
  mobile = "09175550100",
  category = "Café or coffee shop",
  address = "18 East Capitol Drive, Kapitolyo, Pasig",
}) {
  const applied = await patiently(() =>
    merchant.call("/public/partner-applications", {
      method: "POST",
      body: { businessName: name, category, branches: 1, address, ownerName, mobile, email },
    }),
  );
  if (applied.status !== 201) throw new Error(`apply: ${applied.status} ${applied.text.slice(0, 120)}`);

  const decided = await admin.call(`/admin/partner-applications/${applied.body.id}/decide`, {
    method: "POST",
    body: { approve: true },
  });
  if (decided.status !== 200) throw new Error(`approve: ${decided.status} ${decided.text.slice(0, 120)}`);

  const inbox = await admin.call("/_dev/messages?purpose=partner_approved&limit=50");
  const mail = (inbox.body ?? []).find((message) => (message.to ?? message.destination) === email);
  const password = /Temporary password:\s*(\S+)/.exec(mail?.body ?? "")?.[1];
  if (!password) throw new Error(`no approval email with a password reached ${email}`);

  const login = await patiently(() =>
    merchant.call("/auth/login", { method: "POST", body: { email, password } }),
  );
  if (login.status !== 200) throw new Error(`owner login: ${login.status} ${login.text.slice(0, 90)}`);
  return { merchantId: login.body.merchantId, password };
}

/**
 * What a new owner does before Discover shows them: a storefront photo and a
 * description. Approval provisions neither, and the listing rule requires
 * both. Answers the server's own listing state before and after, so a suite
 * can assert the checklist named what was missing and then cleared.
 *
 * `cookie` is the merchant's Cookie header: the photo is multipart, which the
 * JSON-only actors do not send.
 */
export async function completeListing({ api, merchant, cookie }) {
  const before = (await merchant.call("/business/listing")).body;

  const about = await merchant.call("/business/profile", {
    method: "PATCH",
    body: { about: "Fresh from the counter every morning. Show your KYP code and every visit counts." },
  });
  if (about.status !== 200) throw new Error(`about: ${about.status} ${about.text.slice(0, 90)}`);

  const photo = new URL("../apps/customer-pwa/public/images/discover/sage-steam.webp", import.meta.url);
  const form = new FormData();
  form.append("file", new Blob([readFileSync(photo)], { type: "image/webp" }), "storefront.webp");
  const uploaded = await fetch(`${api}/business/branding/image`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: form,
  });
  if (uploaded.status !== 200) {
    throw new Error(`photo: ${uploaded.status} ${(await uploaded.text()).slice(0, 90)}`);
  }

  const after = (await merchant.call("/business/listing")).body;
  return { before, after };
}
