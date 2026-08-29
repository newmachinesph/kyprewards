# KYPStamping POS-Agnostic Integration Plan

Status: frontend demonstration in progress; no live backend, credentials, or provider connections exist yet.

## Outcome

Every KYPStamping business gets an integration workspace that can connect loyalty activity to a supported POS, a custom commerce system, or the KYPStamping sidecar terminal. The experience should be safe for an owner to configure, clear enough for a developer to implement, and usable at the counter even when the POS has no native loyalty support.

The first release is frontend-only. All identifiers, API keys, secrets, webhook deliveries, and connection states shown in the UI are local demo data. A future FastAPI service and background worker will replace those states without changing the core screen flow.

## Product surface

Business workspace navigation adds **Integrations** as its own operational area. Settings remains responsible for messaging providers, billing, privacy, and account-level controls.

The Integrations area contains:

1. **Environment and account context**
   - Sandbox and production switcher.
   - Organization, merchant, branch, and API version identifiers.
   - Explicit demo-only notice while the backend is absent.
2. **Connection method**
   - KYPStamping sidecar terminal for POS-independent scanning.
   - Custom API for direct commerce integration.
   - Provider adapters such as Mosaic or StoreHub, described as requiring provider approval until a real connection is authorized.
3. **API credentials**
   - Separate client-key and secret concepts.
   - Branch and permission scopes.
   - Create, copy, reveal-once, rotate, and revoke demonstrations.
   - Last-used and status indicators.
4. **Inbound POS webhook**
   - Versioned endpoint, provider selection, signing secret, and supported event names.
   - Recent receipt status, correlation ID, latency, and duplicate/idempotency handling.
5. **Outbound business webhook**
   - Destination URL, subscribed events, signing secret, save action, test delivery, and retry action.
6. **Quickstart**
   - Copyable request example using `/api/v1`, Philippine E.164 phone format, tenant context, and `Idempotency-Key`.
7. **Observability**
   - Recent deliveries with success, ignored duplicate, retrying, and failed states.
   - Human-readable recovery guidance without exposing customer payloads or secrets.

## Frontend data model

Until the API exists, each business demo can use JSON shaped like this:

```json
{
  "organizationId": "org_santos_foods",
  "merchantId": "mrc_sweet_crumbs",
  "environment": "sandbox",
  "apiVersion": "v1",
  "connection": {
    "mode": "sidecar",
    "provider": null,
    "status": "ready"
  },
  "credentials": [
    {
      "id": "key_counter_01",
      "label": "Main counter",
      "clientKey": "st_test_sc_7K9P2D4M",
      "secretPreview": "sk_test_••••••••Q4N8",
      "branchIds": ["br_legazpi"],
      "scopes": ["customers:read", "transactions:write", "rewards:read"],
      "status": "active",
      "lastUsedAt": "2026-08-25T09:42:00+08:00"
    }
  ],
  "outboundWebhook": {
    "url": "https://pos.sweetcrumbs.ph/webhooks/kypstamping",
    "events": ["loyalty.transaction.completed", "reward.redeemed"],
    "status": "verified"
  }
}
```

No real secret belongs in a frontend JSON fixture, browser bundle, screenshot, analytics event, or support log.

## Future service topology

The planned local/Docker architecture remains five runtime units plus the public site:

| Unit | Responsibility |
| --- | --- |
| Business Next.js app | Merchant owners and staff, including integration setup |
| Platform admin Next.js app | Tenant support, adapter health, audit and risk operations |
| Customer Next.js PWA | Join, identity, wallet, rewards, consent, and activity |
| Marketing Next.js site | Public acquisition, pricing, docs entry points, and trust content |
| Shared FastAPI service | Versioned REST API, tenant authorization, loyalty rules, ledger, redemption state machine, OTP, and webhook ingestion |
| Background worker | Outbound webhooks, retries, campaigns, messaging, exports, reconciliation, and scheduled jobs |

PostgreSQL should be the source of truth, Redis should handle short-lived state and job coordination, and an S3-compatible store should hold generated exports or imports. Docker Compose can run every unit locally before cloud deployment.

## FastAPI contract

All public integration endpoints are versioned under `/api/v1` and scoped to the authenticated tenant.

- `GET /customers/lookup?phone=+63...`
- `POST /customers`
- `GET /customers/{customer_id}/balance`
- `GET /customers/{customer_id}/rewards`
- `POST /transactions`
- `POST /transactions/{transaction_id}/void`
- `POST /transactions/{transaction_id}/refund`
- `POST /redemptions/reserve`
- `POST /redemptions/{redemption_id}/commit`
- `POST /redemptions/{redemption_id}/cancel`
- `POST /integrations/{provider}/webhook`
- `POST /integration-credentials`
- `POST /integration-credentials/{credential_id}/rotate`
- `DELETE /integration-credentials/{credential_id}`
- `POST /webhook-endpoints/{endpoint_id}/test`
- `POST /webhook-deliveries/{delivery_id}/retry`

Transaction creation, redemption state changes, voids, refunds, webhook receipt, and retry requests require idempotency keys. Phone input is normalized to Philippine E.164 before customer lookup or creation.

## Domain and security rules

- The loyalty ledger is append-only. Adjustments, refunds, expirations, reversals, and redemptions create compensating entries instead of rewriting history.
- Machine credentials are hashed at rest, shown only once at creation or rotation, scoped by organization/merchant/branch, permission, environment, and optional IP allowlist.
- Webhooks use timestamped HMAC signatures, replay-window checks, stable event IDs, redacted logs, exponential retry, and a dead-letter state.
- Redemption uses reserve, commit, and cancel states so a register failure cannot silently consume a reward.
- POS adapters implement one normalized internal interface for customer lookup, sale ingestion, refund/void, reward query, redemption, and health checks.
- The sidecar terminal uses the same API contract as a POS adapter and maintains an encrypted, signed offline queue with explicit reconciliation.
- Staff access follows least privilege. Only owners or integration administrators can create, rotate, reveal, or revoke credentials.
- Customer consent evidence, retention, access, correction, export, and deletion workflows align with Philippine Data Privacy Act obligations.

## Delivery phases

### P0 — safe loyalty core

- Frontend integration setup and sidecar demonstrations.
- Tenant, merchant, branch, terminal, staff-role, and credential models.
- Philippine phone normalization and OTP provider abstraction.
- Customer, transaction, ledger, balance, reward, and redemption APIs.
- Idempotency, request IDs, audit logs, signed inbound/outbound webhooks, retries, voids, and refunds.
- Sandbox environment, API reference, quickstart, and test fixtures.

### P1 — operator scale

- First approved native POS adapter.
- Adapter mapping and branch setup wizard.
- Delivery inspection, manual replay, dead-letter recovery, and reconciliation tools.
- Offline sidecar queue, multi-terminal visibility, catalog/SKU rule mapping, imports, and exports.
- Platform-admin health and support views with tenant-safe impersonation controls.

### P2 — ecosystem depth

- More POS and ecommerce adapters based on merchant demand and provider access.
- Self-service OAuth where providers support it.
- Advanced fraud signals, configurable IP restrictions, regional data controls, and higher-volume event streaming.
- Partner certification, adapter conformance tests, and a public integration marketplace.

## Frontend acceptance criteria

- A business owner can find Integrations from desktop and mobile navigation.
- Every screen clearly says whether it is sandbox, production, connected, pending approval, or demo-only.
- The owner can demonstrate choosing a connection method, creating and rotating a sample key, selecting scopes, copying values, configuring an endpoint, choosing events, sending a test, and retrying a delivery.
- Secrets are masked by default and described as one-time values.
- Empty, loading-like, success, warning, duplicate, retrying, and failed delivery states are represented.
- Controls are keyboard reachable, labels are associated with inputs, focus is visible, and status changes are announced through the existing toast region.
- Mobile layouts preserve key values and delivery details without horizontal page overflow.
- Lint, TypeScript, production build, responsive browser QA, and contrast checks pass.

## Backend handoff criteria

The frontend can switch from fixtures to live data when the FastAPI service provides tenant-scoped endpoints for connection summaries, credentials, endpoints, deliveries, adapter catalog/health, and audit events. Secret creation and rotation responses must return plaintext exactly once; subsequent reads return only a non-sensitive preview. The worker must own webhook delivery and retry execution, while the API records intent and exposes status.
