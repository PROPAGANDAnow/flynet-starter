#!/usr/bin/env node
// Refresh the local member session in .flynet-session.json before the access
// token expires. The refresh token is single-use and rotates, so this reads the
// current one, exchanges it for a fresh access + refresh token, and writes both
// back. The app's middleware does the same thing for the cookie session; this is
// the file-based equivalent for scripts and manual testing.
//
// The token endpoint is a confidential client — it needs FLYNET_CLIENT_SECRET —
// so run this with the env loaded (Node reads .env.local; this script never does):
//
//   node --env-file=.env.local scripts/refresh-flynet-session.mjs
//
// Optional: only refresh when the token expires within N seconds (for a cron/loop):
//   node --env-file=.env.local scripts/refresh-flynet-session.mjs --if-expiring 300
//
// Exit codes: 0 = refreshed (or still fresh and skipped), 1 = error.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SESSION_FILE = join(
  dirname(dirname(fileURLToPath(import.meta.url))),
  ".flynet-session.json",
);
// Mirrors lib/env.ts: unset means production.
const AUTH_BASE_URL = process.env.AUTH_BASE_URL || "https://api.blackbird.xyz/oauth";

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

// Decode a JWT's exp claim (seconds) without verifying — just to record expiry.
function expFromJwt(jwt) {
  try {
    const payload = jwt.split(".")[1];
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(json).exp ?? null;
  } catch {
    return null;
  }
}

const clientId = process.env.FLYNET_CLIENT_ID;
const clientSecret = process.env.FLYNET_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  fail(
    "FLYNET_CLIENT_ID / FLYNET_CLIENT_SECRET not in env. Run with:\n" +
      "  node --env-file=.env.local scripts/refresh-flynet-session.mjs",
  );
}

let session;
try {
  session = JSON.parse(await readFile(SESSION_FILE, "utf8"));
} catch {
  fail(`Couldn't read ${SESSION_FILE}. Sign in first, then save the session.`);
}
if (!session.refresh_token) fail("No refresh_token in the session file.");

// --if-expiring <seconds>: skip the refresh while the token still has headroom.
const args = process.argv.slice(2);
const idx = args.indexOf("--if-expiring");
if (idx !== -1) {
  const window = Number(args[idx + 1]);
  const exp = session.expires_at_epoch ?? expFromJwt(session.access_token);
  const secondsLeft = exp ? exp - Math.floor(Date.now() / 1000) : 0;
  if (secondsLeft > window) {
    console.log(`✓ Still fresh (${secondsLeft}s left, threshold ${window}s) — skipping.`);
    process.exit(0);
  }
}

const form = new URLSearchParams({
  grant_type: "refresh_token",
  refresh_token: session.refresh_token,
  client_id: clientId,
  client_secret: clientSecret,
});

let res;
try {
  res = await fetch(`${AUTH_BASE_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: form.toString(),
  });
} catch (err) {
  fail(`Couldn't reach the token endpoint: ${err.message}`);
}

const data = await res.json().catch(() => null);
if (!res.ok) {
  const reason = data?.error_description || data?.error || `HTTP ${res.status}`;
  fail(
    `Refresh rejected (${reason}). If it's invalid_grant the refresh token was ` +
      "already used or expired — sign in again to get a new one.",
  );
}

const exp = expFromJwt(data.access_token);
const updated = {
  ...session,
  access_token: data.access_token,
  // Refresh tokens rotate (single-use); keep the new one, fall back to the old.
  refresh_token: data.refresh_token ?? session.refresh_token,
  token_type: data.token_type ?? session.token_type ?? "Bearer",
  scope: data.scope ?? session.scope,
  obtained_at: new Date().toISOString(),
  expires_at: exp ? new Date(exp * 1000).toISOString() : undefined,
  expires_at_epoch: exp ?? undefined,
};

await writeFile(SESSION_FILE, JSON.stringify(updated, null, 2) + "\n");
console.log(
  `✓ Refreshed. New token expires ${updated.expires_at ?? "(unknown)"}` +
    ` (${data.expires_in ?? "?"}s).`,
);
