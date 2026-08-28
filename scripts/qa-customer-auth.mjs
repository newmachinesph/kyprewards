import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.CUSTOMER_APP_URL ?? "http://localhost:3002";
/** Mirrors DEMO_CODE in packages/ui/src/auth.tsx and the README. */
const DEMO_CODE = "424242";
const artifactDirectory = join(tmpdir(), "stampr-customer-auth-qa");
await mkdir(artifactDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const runtimeErrors = [];

function watchRuntime(page, surface) {
  page.on("pageerror", (error) => runtimeErrors.push(`${surface}: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`${surface}: ${message.text()}`);
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
  await mobilePage.getByText("Sweet Crumbs", { exact: true }).waitFor();
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
  assert.match(await emailField.inputValue(), /@/);
  await mobilePage.getByRole("button", { name: "Email me a code" }).waitFor();

  await mobilePage.getByRole("button", { name: /^mobile$/i }).click();
  const mobileField = mobilePage.getByLabel("Mobile number");
  await mobileField.fill("");
  await mobilePage.getByRole("button", { name: "Text me a code" }).click();
  await mobilePage.getByText("Enter your mobile number.").waitFor();
  await mobileField.fill("+63 917 555 0182");
  await mobilePage.getByRole("button", { name: "Text me a code" }).click();
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
  // Must match DEMO_CODE in packages/ui/src/auth.tsx, which the README also
  // documents. This previously read "123456" and the journey never completed.
  await codeField.fill("999999");
  await mobilePage.getByRole("button", { name: "Verify and continue" }).click();
  await mobilePage.getByText("That code is not correct.").waitFor();

  await codeField.fill(DEMO_CODE);
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
  const consent = mobilePage.getByRole("checkbox");
  await consent.uncheck();
  await mobilePage.getByRole("button", { name: "Create demo wallet" }).click();
  await mobilePage.getByText("Accept the terms to continue.").waitFor();
  await consent.check();
  await mobilePage.getByRole("button", { name: "Create demo wallet" }).click();
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
