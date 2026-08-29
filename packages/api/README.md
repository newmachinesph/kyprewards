# `@stampr/api`

The data layer for all four apps. Built, tested, and **not yet wired to the
API** — that is deliberate, and step 3 of `backend/INTEGRATION.md` is the one
change that flips it.

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

## What is wired today

`ApiProvider` is in all four root layouts, so the query client is live. The
read hooks call `@stampr/demo-data`'s accessor seam, which still resolves the
fixture — so the hooks work right now against the demo, exactly as the screens
do. When those 31 accessor bodies become `http()` calls, not one line in
`queries.ts` changes. That is the whole reason the seam exists.

`http.ts` is written, typed and unit-tested, and nothing imports it yet.

## Using it

```tsx
"use client";
import { useBusinessCustomers, useApiMutation, keys } from "@stampr/api";

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

## Superseding `DemoState.tsx`

`apps/business-web/src/components/DemoState.tsx` currently holds both kinds of
state in one context. At integration it splits: its server half (programs,
campaigns, staff, integrations, automations) becomes the hooks here, its
client half (`scanHandoff`, `testStampDone`, the webhook draft, the workspace)
becomes the stores here. It is untouched for now so nothing breaks before the
swap.

## Tests

```bash
npm test -w @stampr/api
```

Covers the two parsers and the normalising schemas — the Link-header cursor,
PH mobile normalisation, the peso→centavo rounding, and the published 1–30
stamp range. The hooks are not tested: they are one-line adapters over
accessors that already have a fixture, and a test asserting `useQuery` calls
`useQuery` proves nothing.
