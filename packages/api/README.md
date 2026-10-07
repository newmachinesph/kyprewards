# `@kyprewards/api`

The data layer for the apps. Wired: every screen in the merchant workspace,
the customer wallet and the platform console reads this service, and the
marketing site uses its public endpoints. The marketplace will use its
public reads once a public Discover endpoint exists; it never carries a
session.

## The split

Three concerns, kept apart on purpose:

| Concern | Where | Rule |
|---|---|---|
| Server state | `queries.ts`, `mutations.ts` (TanStack Query) | Anything the API owns |
| Client state | `stores.ts` (zustand) | Anything the API has never heard of |
| Forms | `forms.ts`, `schemas.ts` (react-hook-form + zod) | Input, and the server's verdict on it |

The one rule that matters: **never copy server data into zustand.** Two copies
disagree the moment one refetches, and the bug reads as "the list is stale"
rather than "we cached it twice". Customers, programs, campaigns and metrics
are queries. A scanned-but-unsubmitted transaction is a store.

## What it talks to

`ApiProvider` is in all four root layouts. `endpoints.ts` is every call the
apps make — 31 reads and 15 writes — and `contract.test.ts` runs them against
a live stack, asserting on the real body rather than on what the OpenAPI
schema claims. Start the backend (`make up`) before `npm test`.

`@kyprewards/demo-data` is down to one export: the shared scenario, the ₱286
visit all four apps narrate from their own side. It is a story, not a record,
and the API has no route for it.

## Using it

```tsx
"use client";
import { useBusinessCustomers, useApiMutation, keys } from "@kyprewards/api";

const { data, isPending, error } = useBusinessCustomers({ segment: "VIP" });
```

Mutations get invalidation for free, and should name the narrowest prefix that
is still correct:

```ts
const invite = useApiMutation(inviteStaff, { invalidates: [keys.business.staff()] });
```

Forms get the server's own field errors put back under the inputs:

```tsx
const form = useForm({ resolver: zodResolver(programSchema) });

onError: (error) => {
  const unmatched = applyApiErrors(error, form.setError, form.getValues());
  if (unmatched.length) setBanner(unmatched.map((e) => e.message).join(". "));
};
```

`applyApiErrors` returns what it could not place rather than swallowing it — a
field the server names but the form does not have is an error the user can
otherwise neither see nor fix.

## What is still local

`DemoState.tsx` kept its client half — the webhook draft, the setup ledger,
the scan handoff, the wizard's answers — and gave up its server half to the
hooks here.

Two things in it are still local and have endpoints waiting:
integration credentials (`/integration-credentials`) and webhook deliveries
(`/webhook-deliveries`). Wallet passes are not implemented at all; that one
needs Apple and Google signing certificates.

## Tests

```bash
npm test -w @kyprewards/api
```

Thirty-eight checks: the two parsers and the normalising schemas offline, and
every domain against the running API — field names, units, closed unions, the
idempotency replay, and that a write is committed before its response is sent.

The hooks themselves are not tested. They are one-line adapters over
`endpoints.ts`, and a test asserting `useQuery` calls `useQuery` proves
nothing.

One local constraint: OTP is throttled to three codes per destination per ten
minutes and only the seeded customer has credentials, so the wallet tests and
manual browser testing share that budget. The suite says so plainly when it
runs out.
