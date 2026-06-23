import { type NextRequest, NextResponse } from "next/server";
import { FlynetError } from "@flynetdev/core";
import {
  ACCESS_COOKIE,
  HANDSHAKE_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  appUrl,
  cookieOptions,
  makeOAuth,
} from "../../lib/auth";

// OAuth callback (the registered redirect URI, /callback). Verifies the CSRF
// state set by /api/auth/login, exchanges the single-use authorization code
// server-side (with FLYNET_CLIENT_SECRET + the PKCE verifier), and stores the tokens
// in HttpOnly cookies before bouncing back to the homepage.
export async function GET(req: NextRequest) {
  const home = (error?: string) =>
    NextResponse.redirect(
      appUrl(error ? `/?auth_error=${error}` : "/", req.url),
    );

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const providerError = req.nextUrl.searchParams.get("error");
  const pendingRaw = req.cookies.get(HANDSHAKE_COOKIE)?.value;

  // The provider can bounce back with an explicit error (consent denied, a
  // misconfigured OAuth app) instead of a code. Surface it rather than hiding
  // it behind the generic "missing code" message below.
  if (providerError) return home(`provider_${providerError}`);

  // Code + state present but no handshake cookie ⇒ the cookie set when sign-in
  // started wasn't sent back. It's host-scoped, so this almost always means the
  // flow began on a different host than the callback landed on (e.g. started on
  // localhost while REDIRECT_URI points at a tunnel). Flag that specifically —
  // it's a host/cookie problem, not bad client config.
  if (code && state && !pendingRaw) return home("handshake_cookie_missing");

  if (!code || !state || !pendingRaw) return home("missing_code_or_state");

  let pending: { state: string; codeVerifier: string };
  try {
    pending = JSON.parse(pendingRaw);
  } catch {
    return home("bad_handshake");
  }
  if (pending.state !== state) return home("state_mismatch");

  const oauth = makeOAuth();
  if (!oauth) return home("missing_client_config");

  try {
    const tokens = await oauth.exchangeCode({
      code,
      codeVerifier: pending.codeVerifier,
    });

    const res = home();
    res.cookies.delete(HANDSHAKE_COOKIE);
    res.cookies.set(ACCESS_COOKIE, tokens.access_token, {
      ...cookieOptions,
      maxAge: tokens.expires_in,
    });
    if (tokens.refresh_token) {
      res.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
        ...cookieOptions,
        maxAge: REFRESH_MAX_AGE,
      });
    }
    return res;
  } catch (error) {
    // The token endpoint rejected the exchange. Surface WHY (status + the
    // provider's error code, e.g. 401 invalid_client = bad client_secret;
    // 400 invalid_grant = code/redirect_uri/verifier mismatch) instead of a
    // blanket "exchange_failed", and log the full error server-side.
    console.error("[callback] token exchange failed:", error);
    const detail =
      error instanceof FlynetError
        ? `${error.status ?? "?"}_${error.code ?? error.kind ?? "error"}`
        : "network";
    return home(`exchange_failed:${detail}`);
  }
}
