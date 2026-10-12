# Google Play: listing and declarations for KYP (`ph.kyp.wallet`)

Everything Play Console asks for before the app can be published, written to
match what the app and the API actually do (checked 12 October 2026). The
marketing copy follows kyp.ph; when kyp.ph changes, change this too.
Play account: Superlee Software (organization), app id 4974465722373240145.

## Store listing (Grow > Store presence > Main store listing)

**App name** (30 max)

```
KYP: Rewards from local shops
```

**Short description** (80 max)

```
Stamp cards and rewards from the shops you visit, under one member code.
```

**Full description** (4,000 max)

```
KYP keeps the loyalty cards of the shops you already visit in one place: the bakery on your street, your barber, the milk tea stall near work. One member code works at all of them, so there's no stack of paper cards to lose.

HOW IT WORKS
Scan the code on a shop's poster or sticker, or open its link, and join with your mobile number or email. A welcome stamp lands on your card straight away, marked pending until your first visit. At the counter, staff scan your code (or find you by mobile number) and the stamp becomes real. Every visit after that is one scan.

When a card fills up, the reward is held for you. Staff reserve it at the counter and you approve it on your phone before it's handed over, so nobody can spend your reward but you. The card then starts again, and you can hold more than one reward at a time.

MORE THAN STAMP CARDS
Shops on KYP can run points and cashback, member discounts, memberships, coupons, a reward catalog you choose from, prepaid passes and gift cards. Whatever a shop runs shows up on its card in your wallet, with the rules written out: how you earn, when things expire and what you hold.

YOUR CODE WORKS WITHOUT SIGNAL
Your member code is saved on your phone, so it still opens at a counter with no data.

FIND SHOPS NEAR YOU
Discover lists the shops on KYP, with their hours and how far they are when you allow location. You can join a shop from its page.

SEND A PASALUBONG
Send a held reward or points to a friend who uses KYP, with a short note.

YOU DECIDE WHAT EACH SHOP SEES
Joining a shop is not consent to marketing. Each shop asks separately, per channel, and you can turn offers off, leave a shop or delete your account from the app at any time. Shops see your name, member code, visits and rewards with them, never your phone number or email.

KYP works at shops that use KYP Rewards. Shop owners can learn more at kyprewards.com.
```

**App category:** Shopping
**Tags:** loyalty, rewards
**Contact email:** support@kyprewards.com
**Website:** https://kyp.ph
**Privacy policy:** https://kyp.ph/privacy

**Graphics:** app icon 512 x 512 (`store/icon-512.png`), feature graphic
1024 x 500 (`store/feature-graphic.png`), phone screenshots 1080 x 1920
(`store/screenshots/`).

## Release notes (build 4, version 1.0.0)

```
First release: join shops from their poster or link, collect stamps and points, approve rewards on your phone, and carry one member code that works offline.
```

## App content declarations (Policy > App content)

**Privacy policy:** https://kyp.ph/privacy

**App access:** All or some functionality is restricted. Add instructions:
- Name: `Review account`
- Username: `appreview@kyp.ph`
- Password: the review account's password (kept out of this file)
- Other information:
  ```
  Sign in with "Email", then the email and password above. No one-time code or second step is needed. The wallet is empty until you join a shop: open Discover and tap Join on any listed shop, or scan a shop's poster QR.
  ```

**Ads:** No, the app does not contain ads.

**Content rating:** questionnaire category "All Other App Types". Answer
No to violence, sexuality, language, controlled substances, gambling and
crude humour. Users can interact: **Yes** (a gift of a reward or points can
carry a short note to another KYP user; there is no open chat); shares
location with other users: No; digital purchases: No (shoppers pay shops in
person, never in the app). Expected result: Everyone / PEGI 3 or equivalent,
with a "Users Interact" note.

**Target audience and content:** 18 and over only. Not designed for
children, and the store listing does not target them.

**News app:** No. **Government app:** No. **Health app:** None.
**Financial features:** None. Gift cards and stored value are issued by the
shops and redeemed in person; the app takes no payments.

**Data safety** (answers below).

## Data safety

**Overview**
- Does your app collect or share any of the required user data types? **Yes**
- Is all of the user data collected by your app encrypted in transit? **Yes**
- Which account creation methods does your app support? **Username and password**, **OAuth** (Sign in with Google, Sign in with Apple), plus one-time codes by SMS or email.
- Delete account URL: **https://kyp.ph/delete-account** (also in the app: Profile > Leave or delete)
- Can users request that some data be deleted without deleting their account? **Yes** (leave a shop, withdraw consent per channel, remove birthday)

**Data types.** "Shared" means sent to a third party other than a service
provider. Shops a shopper joins are third parties, so data they see is
marked shared. Service providers (hosting, SMS, email, push delivery) are
not sharing under Play's definitions.

| Category | Data type | Collected | Shared | Optional | Purposes |
|---|---|---|---|---|---|
| Location | Approximate location | Yes, processed ephemerally | No | Yes | App functionality (distance to shops, nearby list) |
| Location | Precise location | Yes, processed ephemerally | No | Yes | App functionality (distance to shops, nearby list) |
| Personal info | Name | Yes | Yes (shops joined) | No | App functionality, Account management |
| Personal info | Email address | Yes | No | Yes (if signing up by mobile) | Account management, App functionality (sign-in codes, receipts), Developer communications |
| Personal info | Phone number | Yes | No | Yes (if signing up by email) | Account management, App functionality (sign-in codes, counter lookup) |
| Personal info | User IDs | Yes (account id, member code) | Yes (member code, shops joined) | No | App functionality, Account management |
| Personal info | Other info | Yes (birthday day and month, no year) | Yes (shops joined) | Yes | Personalization (birthday offers) |
| Financial info | Purchase history | Yes (visits, amounts a shop records at its counter, rewards) | Yes (the shop where it happened) | No | App functionality |
| Messages | Other in-app messages | Yes (note on a gift) | No | Yes | App functionality |
| App activity | Other user-generated content | Yes (visit feedback rating and comment) | Yes (the shop it is about) | Yes | App functionality |
| Device or other IDs | Device or other IDs | Yes (push notification token) | No | Yes | App functionality (notifications) |

**Not collected:** photos and videos (the camera only scans a QR code on the
device), audio, files and docs, calendar, contacts, health and fitness,
web browsing, crash logs and diagnostics (the app sends none), payment
info, credit score, race, religion, sexual orientation, political views,
address.

Notes behind the answers:
- Location is sent only as request parameters to `/customer/nearby` and
  `/discover`, used to compute distance and not stored. The API image runs
  uvicorn with `--no-access-log` so the query string never reaches the logs;
  keep it that way or change "processed ephemerally" to stored.
- Biometrics (fingerprint or face to unlock the app) stay on the device in
  the Android keystore and are not collected.
- Shops see a member's name, member code, birthday, visits, spend and
  rewards (`BusinessCustomer` in the API), never their phone or email.
