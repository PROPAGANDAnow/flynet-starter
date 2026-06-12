---
name: setup-matt-pocock-skills
description: Sets up an `## Agent skills` block in CLAUDE.md/AGENTS.md and `docs/agents/` so the engineering skills know this repo's local-filesystem issue tracker, triage label vocabulary, and domain doc layout. Run before first use of to-plan, to-work, triage, diagnose, tdd, improve-codebase-architecture, or zoom-out — or if those skills appear to be missing context.
disable-model-invocation: true
---

# Setup Matt Pocock's Skills

Scaffold the per-repo configuration the engineering skills assume. Everything is **local-filesystem** — no GitHub, GitLab, or Linear:

- **Issue tracker** — issues, PRDs, and tasks live as markdown files under `.scratch/` in this repo.
- **Triage labels** — the strings used for the five canonical triage roles (recorded in each file's `Status:` line).
- **Domain docs** — where `CONTEXT.md` and ADRs live, and the consumer rules for reading them.

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.

## Process

### 1. Explore

Read whatever already exists; don't assume:

- `CLAUDE.md` and `AGENTS.md` at the repo root — does either exist? Is there already an `## Agent skills` section?
- `CONTEXT.md` and `CONTEXT-MAP.md` at the repo root
- `docs/adr/` and any `src/*/docs/adr/` directories
- `docs/agents/` — does this skill's prior output already exist?
- `.scratch/` — is the local-markdown issue convention already in use?
- `.flynet/` — the dev-journey state folder (progress.json, journey.json), if a run has happened

### 2. Present findings and ask

Summarise what's present and missing, then walk the user through the two decisions **one at a time**. Assume the user doesn't know these terms — each starts with a short explainer.

**Section A — Triage label vocabulary.**

> Explainer: When the `triage` skill processes an issue, it moves it through a state machine — needs evaluation, waiting on reporter, ready for an AFK agent, ready for a human, or won't fix. With a local-markdown tracker, the "label" is a `Status:` line in the issue file. If you prefer different strings than the defaults, set them here.

The five canonical roles:

- `needs-triage` — maintainer needs to evaluate
- `needs-info` — waiting on reporter
- `ready-for-agent` — fully specified, AFK-ready
- `ready-for-human` — needs human implementation
- `wontfix` — will not be actioned

Default: each role's string equals its name. Ask if they want to override any.

**Section B — Domain docs.**

> Explainer: Some skills (`improve-codebase-architecture`, `diagnose`, `tdd`, `to-plan`) read `CONTEXT.md` for the project's domain language and `docs/adr/` for past decisions. They need to know whether the repo has one global context or several.

- **Single-context** — one `CONTEXT.md` + `docs/adr/` at the repo root. Most repos.
- **Multi-context** — `CONTEXT-MAP.md` at the root pointing to per-context `CONTEXT.md` files (typically a monorepo).

### 3. Confirm and edit

Show the user a draft of the `## Agent skills` block and the `docs/agents/*.md` contents. Let them edit before writing.

### 4. Write

**Pick the file to edit:** if `CLAUDE.md` exists, edit it; else if `AGENTS.md` exists, edit it; if neither, ask which to create. Never create one when the other already exists.

If an `## Agent skills` block already exists, update it in place rather than appending a duplicate.

The block:

```markdown
## Agent skills

### Issue tracker

Issues, PRDs, and tasks live as local markdown files under `.scratch/`. Dev-journey state lives in `.flynet/`. See `docs/agents/issue-tracker.md`.

### Triage labels

[one-line summary of the label vocabulary]. See `docs/agents/triage-labels.md`.

### Domain docs

[one-line summary — "single-context" or "multi-context"]. See `docs/agents/domain.md`.
```

Then write the three docs files using the seed templates in this skill folder as a starting point:

- [issue-tracker-local.md](./issue-tracker-local.md) — local-markdown issue tracker (the only tracker these skills use)
- [triage-labels.md](./triage-labels.md) — label mapping
- [domain.md](./domain.md) — domain doc consumer rules + layout

### 5. Done

Tell the user setup is complete and which engineering skills will now read from these files. They can edit `docs/agents/*.md` directly later.
