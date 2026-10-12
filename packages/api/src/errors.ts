/**
 * What a failed call throws.
 *
 * Its own module, and in this package rather than in `@kyprewards/demo-data`
 * where it started, for one concrete reason: `demo-data` imports the fixture
 * JSON, so anything that reaches it can only be loaded by a bundler. Keeping
 * the error here leaves `http.ts` and `endpoints.ts` dependency-free, which is
 * what lets `contract.test.ts` load them in bare Node and call the real API.
 */

export class ApiError extends Error {
  readonly status: number;

  /**
   * Echoed by every error body and logged server-side against the same
   * request, so a user's screenshot maps to a log line.
   */
  readonly requestId?: string;

  /**
   * The whole error envelope, for the facts a refusal carries beside
   * `detail` - `code` and `via` on a sign-up 409, for one. Empty when the
   * body was not JSON.
   */
  readonly body: Readonly<Record<string, unknown>>;

  // Fields are declared and assigned rather than written as constructor
  // parameter properties. Those need real code generation, and Node's
  // --experimental-strip-types only erases types - which is how the contract
  // tests load this file without a build step.
  constructor(
    message: string,
    status: number,
    requestId?: string,
    body: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
    this.body = body;
  }
}

/**
 * What a call throws when no answer came back at all: offline, a refused
 * connection, DNS. `fetch` rejects with the platform's own text for these -
 * "fetch failed", or on Android "java.net.ConnectException: Failed to connect
 * to localhost/127.0.0.1:8000" - and screens printed it as it came.
 *
 * Deliberately not an `ApiError`. Callers read `instanceof ApiError` as "the
 * server answered": the session gate, query retries, the till's offline queue
 * and the first-stamp claim all keep or retry what a non-`ApiError` failed.
 * A status-0 `ApiError` would have quietly turned each of those into a
 * refusal - the queue would drop a stamp it should resend.
 */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super("Can't reach KYP right now. Check your connection and try again.", { cause });
    this.name = "NetworkError";
  }
}
