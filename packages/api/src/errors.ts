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
