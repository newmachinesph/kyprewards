import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.CUSTOMER_APP_URL ?? "http://localhost:3002";
const apiBase = process.env.KYP_TEST_API ?? "http://localhost:8000/api/v1";

/**
 * The code the API actually sent, read back from the dev sink.
 *
 * There used to be a fixed "424242" the browser compared for itself. Sign-in
 * is the server's answer now, so the only way to know the code is to read the
 * message that carried it - which is what a person does, from their phone.
 */
async function latestOtp() {
  const response = await fetch(`${apiBase}/_dev/messages?purpose=otp&limit=1`);
  assert.ok(response.ok, `dev sink answered ${response.status}`);
  const [message] = await response.json();
  const code = /\d{6}/.exec(message?.body ?? "")?.[0];
  assert.ok(code, "no OTP reached the dev sink");
  return code;
}
const artifactDirectory = join(tmpdir(), "kypstamping-customer-auth-qa");
await mkdir(artifactDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const runtimeErrors = [];

function watchRuntime(page, surface) {
  page.on("pageerror", (error) => runtimeErrors.push(`${surface}: ${error.message}`));
  page.on("console", (message) => {
    // The browser logs "Failed to load resource: …" for every non-2xx and
    // names neither the route nor the reason. The response listener reports
    // those properly, so this only carries real page errors.
    if (message.type() !== "error") return;
    if (message.text().startsWith("Failed to load resource")) return;
    runtimeErrors.push(`${surface}: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    if (!response.url().includes("/api/")) return;
    const path = new URL(response.url()).pathname;
    // Signed out is the whole point of this journey: the shell asks who is
    // signed in before anybody is, and 401 is the answer, not a fault. A
    // refused one-time code is deliberate too - the suite sends a wrong one.
    if (response.status() === 401 && path.endsWith("/auth/session")) return;
    if (response.status() === 401 && path.endsWith("/auth/otp/verify")) return;
    runtimeErrors.push(`${surface}: ${response.status()} ${path}`);
  });
}

async function viewportState(page) {
  return page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    scrollY: window.scrollY,
    visualOffsetTop: window.visualViewport?.offsetTop ?? 0,
    headerTop: document.querySelector("header")?.getBoundingClientRect().top ?? null,
    horizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));
}

try {
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  watchRuntime(mobilePage, "mobile");

  await mobilePage.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await mobilePage.getByRole("heading", { name: "Open your wallet." }).waitFor();
  // Deliberately not a real shop's name: 0ba2c7f renamed this illustration
  // off "Sweet Crumbs" so a visitor cannot mistake it for someone's card.
  await mobilePage.getByText("Your local favourite", { exact: true }).waitFor();
  await mobilePage.getByRole("button", { name: "Text me a code" }).waitFor();
  await mobilePage.waitForTimeout(700);
  const loginFit = await viewportState(mobilePage);
  assert.equal(loginFit.horizontalOverflow, false, "Mobile login must not overflow horizontally");
  await mobilePage.screenshot({
    path: join(artifactDirectory, "login-mobile.png"),
    fullPage: false,
  });

  const emailToggle = mobilePage.getByRole("button", { name: /^email$/i });
  await emailToggle.click();
  await mobilePage.waitForFunction(
    () =>
      document
        .querySelector('button[aria-pressed="true"]')
        ?.textContent?.toLowerCase()
        .includes("email"),
  );
  const emailField = mobilePage.locator('input[type="email"]').first();
  await emailField.waitFor();
  assert.equal(await emailField.getAttribute("type"), "email");
  // Empty, with an email-shaped hint. This used to assert the field arrived
  // holding jacqueline.daniel@example.com - a real value, not a placeholder -
  // which is how a brand new wallet ended up sending its one-time code to a
  // stranger. The toggle still has to switch the field; it just must not
  // answer the question for you.
  assert.equal(await emailField.inputValue(), "");
  assert.match(await emailField.getAttribute("placeholder"), /@/);
  await mobilePage.getByRole("button", { name: "Email me a code" }).waitFor();

  await mobilePage.getByRole("button", { name: /^mobile$/i }).click();
  const mobileField = mobilePage.getByLabel("Mobile number");
  await mobileField.fill("");
  await mobilePage.getByRole("button", { name: "Text me a code" }).click();
  await mobilePage.getByText("Enter your mobile number.").waitFor();
  await mobileField.fill("+63 917 555 0182");
  const [otpResponse] = await Promise.all([
    mobilePage.waitForResponse((response) => response.url().includes("/auth/otp/request")),
    mobilePage.getByRole("button", { name: "Text me a code" }).click(),
  ]);
  // Three codes per destination per ten minutes, by design. Running this suite
  // in a tight loop trips it, and without saying so the failure reads like a
  // broken sign-in.
  assert.notEqual(
    otpResponse.status(),
    429,
    "OTP throttled: three codes per ten minutes per destination. Wait, or reseed the stack.",
  );
  await mobilePage.waitForURL(/\/verify$/);

  await mobilePage.getByRole("heading", { name: "Enter your code." }).waitFor();
  await mobilePage.getByText("Code ready", { exact: true }).waitFor();
  await mobilePage.waitForTimeout(700);
  const verifyFit = await viewportState(mobilePage);
  assert.equal(verifyFit.scrollY, 0, "Verification must open at the top of the app shell");
  assert.equal(verifyFit.visualOffsetTop, 0, "Verification visual viewport must start at the top");
  assert.equal(verifyFit.headerTop, 0, "Verification wallet header must not be clipped");
  const codeField = mobilePage.getByLabel("Six-digit verification code");
  await mobilePage.screenshot({
    path: join(artifactDirectory, "verify-mobile.png"),
    fullPage: false,
  });
  await codeField.fill("");
  assert.equal(
    await mobilePage.getByRole("button", { name: "Verify and continue" }).isDisabled(),
    true,
  );
  // The refusal is the API's now, not a string this app compares for itself,
  // so the assertion is that the wrong code is refused and the journey stays
  // put - not that it is refused in one particular wording.
  await codeField.fill("999999");
  await mobilePage.getByRole("button", { name: "Verify and continue" }).click();
  await mobilePage.getByText(/not valid|not correct|expired/i).waitFor();
  assert.match(new URL(mobilePage.url()).pathname, /\/verify$/);

  await codeField.fill(await latestOtp());
  await mobilePage.getByRole("button", { name: "Verify and continue" }).click();
  await mobilePage.waitForURL(/#home$/);

  await mobilePage.goto(`${baseUrl}/create-account`, { waitUntil: "networkidle" });
  await mobilePage.getByRole("heading", { name: "Set up your wallet." }).waitFor();
  await mobilePage.getByText("One free wallet", { exact: true }).waitFor();
  await mobilePage.waitForTimeout(700);
  const signupStart = await viewportState(mobilePage);
  assert.equal(signupStart.scrollY, 0, "Signup must open at the top of the app shell");
  await mobilePage.screenshot({
    path: join(artifactDirectory, "create-mobile.png"),
    fullPage: false,
  });
  // A real registration now: name and mobile are required, and the button is
  // "Create wallet" - there is nothing demo about it any more.
  await mobilePage.getByLabel("Full name").fill("Tessa Cruz");
  // Unique per run: the API answers the same whether or not the number is
  // known, but a fresh one keeps repeated runs from piling onto one account.
  const newMobile = `+63 917 ${String(Date.now()).slice(-7, -4)} ${String(Date.now()).slice(-4)}`;
  await mobilePage.getByLabel("Mobile number").fill(newMobile);
  const consent = mobilePage.getByRole("checkbox");
  await consent.uncheck();
  await mobilePage.getByRole("button", { name: "Create wallet" }).click();
  await mobilePage.getByText("Accept the terms to continue.").waitFor();
  await consent.check();
  await mobilePage.getByRole("button", { name: "Create wallet" }).click();
  await mobilePage.waitForURL(/\/verify$/);
  const createFit = await viewportState(mobilePage);
  assert.equal(createFit.horizontalOverflow, false, "Mobile signup must not overflow horizontally");

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  watchRuntime(desktopPage, "desktop");
  await desktopPage.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(700);
  const shell = desktopPage.locator(".customer-auth .phone-shell");
  const shellBox = await shell.boundingBox();
  assert.ok(shellBox, "Desktop wallet shell must be visible");
  assert.ok(shellBox.width <= 462, "Desktop wallet shell must retain phone proportions");
  assert.ok(
    Math.abs(shellBox.x + shellBox.width / 2 - 720) < 3,
    "Desktop wallet shell must be horizontally centered",
  );
  const desktopFit = await viewportState(desktopPage);
  assert.equal(desktopFit.horizontalOverflow, false, "Desktop auth must not overflow horizontally");
  await desktopPage.screenshot({
    path: join(artifactDirectory, "login-desktop.png"),
    fullPage: false,
  });

  assert.deepEqual(runtimeErrors, [], `Runtime errors found:\n${runtimeErrors.join("\n")}`);

  console.log(
    JSON.stringify(
      {
        passed: true,
        checks: [
          "mobile app shell and loyalty identity",
          "mobile/email channel switch",
          "empty identifier validation",
          "login to verification navigation",
          "auth route scroll-position reset",
          "verification disabled and completed states",
          "signup consent validation and navigation",
          "mobile horizontal viewport fit",
          "desktop centered phone-shell fit",
          "browser console and page errors",
        ],
        screenshots: [
          join(artifactDirectory, "login-mobile.png"),
          join(artifactDirectory, "verify-mobile.png"),
          join(artifactDirectory, "create-mobile.png"),
          join(artifactDirectory, "login-desktop.png"),
        ],
      },
      null,
      2,
    ),
  );

  await desktopContext.close();
  await mobileContext.close();
} finally {
  await browser.close();
}
