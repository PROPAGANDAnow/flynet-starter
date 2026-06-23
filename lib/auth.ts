import { FlynetOAuth } from "@flynetdev/core";
import { env } from "./env";

// Server-only OAuth wiring (Token-Mediating Backend, per the Flynet docs):
// the backend holds FLYNET_CLIENT_SECRET and the refresh token; the browser only ever
// sees the short-lived access token. Never import this from a Client Component.

/** Short-lived member access token (60 min, mirrors the token's expires_in). */
export const ACCESS_COOKIE = "fn_access";
/** Rotating refresh token (up to 30 days, single-use — rotated on every refresh). */
export const REFRESH_COOKIE = "fn_refresh";
/** PKCE state + verifier parked between the authorize redirect and the callback. */
export const HANDSHAKE_COOKIE = "fn_oauth_pending";

export const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

// Everything the member routes + components need, including the pay button
// (payment intents are scope-gated). Scope names are exact-match
// ("read:profiles" is rejected) and routes outside these return 403.
//
// NOTE: `read:checkins` is intentionally omitted. The production OAuth app this
// starter authenticates against isn't provisioned for it, and the authorize
// endpoint rejects the WHOLE request with `invalid_request` if any requested
// scope isn't granted — so including it blocks sign-in entirely. Member
// check-in features (GET /users/me/check_ins, GET /memberships) need this scope;
// add it back here once Blackbird grants it to the OAuth app. (Restaurant
// check-in counts on the cards use the Discovery API key, not this token, so
// they're unaffected.)
export const SCOPES = [
  "read:profile",
  "read:wallets",
  "read:payment_intent",
  "write:payment_intent",
];

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  path: "/",
} as const;

/**
 * The redirect URI the OAuth flow uses, or null when none can be determined.
 * Prefers an explicit REDIRECT_URI (set via the dev drawer locally, or by
 * hand). When that's unset, derives one from the hosting platform so a Vercel
 * deploy works without the "set REDIRECT_URI, then redeploy" step everyone
 * forgets: Vercel injects VERCEL_PROJECT_PRODUCTION_URL (a bare hostname) on
 * every deploy, and the stable production host is what we want OAuth to land on.
 *
 * A derived URI still has to be whitelisted on the Blackbird side, exactly like
 * an explicit one — deriving only saves setting the env var, not the whitelist.
 */
export function resolvedRedirectUri(): string | null {
  if (env.REDIRECT_URI) return env.REDIRECT_URI;
  if (env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}/callback`;
  }
  return null;
}

/**
 * Where browser-facing auth redirects land. Behind a tunnel (ngrok/Codespaces)
 * the request URL the server sees carries the local host, not the public one —
 * so derive the public origin from the resolved redirect URI (the OAuth
 * session's cookies live on that host by definition) and fall back to the
 * request URL without it.
 */
export function appUrl(path: string, requestUrl: string | URL): URL {
  return new URL(path, resolvedRedirectUri() ?? requestUrl);
}

type ForwardableRequest = { headers: Headers; nextUrl: URL };

/**
 * The origin the browser is actually viewing, reconstructed from forwarded
 * proxy headers (falling back to the request host). Unlike {@link appUrl} this
 * does NOT depend on REDIRECT_URI, so it can carry a setup-error redirect back
 * to the right host even when REDIRECT_URI is the thing that's missing.
 */
export function publicOrigin(req: ForwardableRequest): URL {
  const host =
    (req.headers.get("x-forwarded-host") || req.nextUrl.host)
      .split(",")[0]
      .trim();
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
    req.nextUrl.protocol.replace(":", "");
  return new URL(`${proto}://${host}`);
}

/**
 * True when no redirect URI can be resolved (neither REDIRECT_URI nor a
 * platform-derived one). Without it the SDK falls back to a
 * localhost:3000/callback redirect_uri that Blackbird won't have whitelisted,
 * so sign-in would bounce to a dead callback. Callers block the flow and
 * surface a setup error instead of starting a doomed round-trip — note the dev
 * browser is on localhost even when a tunnel is up, so host alone can't tell us.
 */
export function redirectUriMissing(): boolean {
  return !resolvedRedirectUri();
}

/** Build the SDK's OAuth helper from env, or null when the app isn't configured. */
export function makeOAuth(): FlynetOAuth | null {
  const clientId = env.FLYNET_CLIENT_ID;
  const clientSecret = env.FLYNET_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return new FlynetOAuth({
    clientId,
    clientSecret,
    redirectUri: resolvedRedirectUri() ?? "http://localhost:3000/callback",
    scopes: SCOPES,
    // Defaults to production (env defaults AUTH_BASE_URL to it). Set
    // AUTH_BASE_URL to override (e.g. the SDK's staging default) — there's no
    // named "production" environment in the SDK yet, so production is spelled
    // out explicitly here.
    authBaseUrl: env.AUTH_BASE_URL,
    // The audience the token is minted for — the production API gateway. The
    // staging form hyphenates this (api-staging) as the auth tenant in claims.
    audience: env.AUTH_AUDIENCE,
  });
}
