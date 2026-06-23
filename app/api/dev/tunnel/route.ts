import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { blockInProduction } from "../../../../lib/dev-only";

// Backend for the dev onboarding drawer's second step: report the public URL
// sign-in can redirect back to. Two environments, one shape:
//   • Codespaces — GitHub forwards every port to a public-capable HTTPS URL and
//     injects the parts to build it, so there's no tunnel to start and no probe.
//   • local dev  — shell out to a script that probes a running ngrok agent.
// Dev-only — see lib/dev-only.ts.
const exec = promisify(execFile);
const SCRIPT = join(process.cwd(), "scripts", "check-ngrok.sh");

type TunnelStatus = {
  running: boolean;
  url: string | null;
  kind: "codespaces" | "ngrok";
};

export async function GET() {
  const blocked = blockInProduction();
  if (blocked) return blocked;

  // Codespaces wins when present: the public URL is `https://<name>-<port>.<domain>`,
  // derivable straight from the env GitHub injects — no ngrok, no install. These
  // are platform-runtime signals (not app config), so they're read here rather
  // than added to the typed env schema in lib/env.ts.
  const name = process.env.CODESPACE_NAME;
  const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  if (name && domain) {
    return NextResponse.json({
      running: true,
      url: `https://${name}-3000.${domain}`,
      kind: "codespaces",
    } satisfies TunnelStatus);
  }

  try {
    // The script always prints JSON and exits 0; a 5s timeout guards against a
    // wedged curl. `bash <script>` avoids depending on the file's +x bit.
    const { stdout } = await exec("bash", [SCRIPT], { timeout: 5000 });
    const result = JSON.parse(stdout.trim()) as {
      running: boolean;
      url: string | null;
    };
    return NextResponse.json({ ...result, kind: "ngrok" } satisfies TunnelStatus);
  } catch {
    // Script missing, bash absent, or unparseable output — treat as "not up".
    return NextResponse.json({
      running: false,
      url: null,
      kind: "ngrok",
    } satisfies TunnelStatus);
  }
}
