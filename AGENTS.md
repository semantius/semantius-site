# Agent Instructions

> **🔒 CRITICAL: Do not modify this file. It is a global SOP maintained by the human user only. It is shared across many repositories and organizations. Changes here are never required — if you think a rule needs changing, say so explicitly rather than editing this file.**

## The User Is in Control

- **Do what the user instructs, and only that.** Never edit, create, delete, commit, push or deploy anything the user did not ask for.
- **A question is not an instruction.** When the user asks a question or points out a problem, answer it and propose a fix. Change nothing until the user tells you to.
- **When the user gives an instruction, carry it out.** Do not ask for confirmation again, and do not add steps the user did not ask for: a merge does not include a push.
- **Never add guards, checks, rules or behaviors on your own,** in code, scripts, specs or memory. Propose them, and add them only after the user approves.

## Project Context

**Before starting any task**, read `CONTEXT-MEMORY.md`. It holds the architecture decisions, platform constraints and preferences the user has approved, and you MUST incorporate them into your work.

### `CONTEXT-MEMORY.md` changes only after the user approves

- **Propose, then wait.** When you find something a future session would otherwise get wrong (a non-obvious platform constraint, an architectural pattern, an environmental quirk), or the user states a preference, propose the exact text and where it goes. Write it only after the user approves that text. Approval of other work, or an instruction to fix something, is not approval of a memory change.
- **Record only what was approved, in the approved words.** Never turn the user's words into a broader rule of your own, and never call a rule the user's unless the user stated or approved it.
- **It is a reference, not a history.** No dates, no session records, no progress notes, no "RESOLVED" or "LESSON LEARNED" entries, and no stories of what went wrong. State the rule and its reason in one or two sentences, in the relevant existing section. Never append chronologically.
- **Never write a secret value into it** (keys, tokens, passwords, webhook URLs). Name the secret and where it is stored instead.
- **Commit a memory change on its own,** with a message that says what changed in `CONTEXT-MEMORY.md`. Never fold it into other work.
- **Ask before proposing:** _"Would a capable developer, reading only the code and this file, make this mistake again?"_ If no, do not propose it.

### When you make a mistake or the user corrects you

1.  **Analyze:** Identify the root cause of the error or the core requirement.
2.  **Route:** Decide where the knowledge belongs:
    - **Specific file** → a comment in that file explaining the _why_, as part of a change the user asked for. If the fix is already self-evident from well-commented code, nothing more is needed.
    - **Cross-cutting / architectural / no single file home** → propose an entry for `CONTEXT-MEMORY.md` (see above), and write it only after the user approves it.
    - **Rule of thumb:** if the knowledge would go stale or become wrong when the relevant code is refactored, it belongs in the code, not in a memory file.
    - **What belongs in `CONTEXT-MEMORY.md`:** environment or toolchain constraints specific to this repo, third-party API quirks, monorepo-wide conventions that differ from the obvious default, architectural decisions and their reasoning, and preferences the user has stated and approved for recording.
    - **What never belongs in `CONTEXT-MEMORY.md`:** individual bug fixes, task records, dates or session identifiers, stories of incidents, secret values, and anything already stated in this SOP.
3.  **Prevent:** Tell the user how you will avoid this mistake in future. Record it only if the user approves.

## Workspace

This is a **pnpm workspace monorepo** orchestrated by **Turborepo** (`turbo.json`). All packages live under the `apps/` and `packages/` directories.

- `pnpm` — package manager & workspace orchestration
- `turbo` — task runner (build, dev, lint pipelines defined in `turbo.json`)

## Environment

The workspace is provisioned automatically via `workplace/setup.sh` on session start. The following are installed globally and available on PATH:

- `agent-browser` — headless browser automation
- `dotenvx` — secret decryption
- `wrangler` — Cloudflare deployment
- `pnpm` — package manager

Do not re-run `setup.sh` manually unless the environment appears broken.

## Commands

```bash
pnpm dev              # start all apps in dev mode (Vite HMR at http://localhost:5173)
pnpm build            # build all apps
pnpm lint             # lint all apps
```

## Development vs. Completion

### During development — fast iteration

Use `pnpm dev` (or `pnpm --filter web dev`) for instant Vite HMR feedback while writing code. Use this freely during a task for rapid iteration. Localhost is a development tool only — **it is not a completion gate**.

### Task completion — mandatory

A task is **not complete** until it has been deployed to a Cloudflare branch preview and verified there. Do not mark a task done based on localhost behavior alone.

## Secrets

Secrets are encrypted in `.env` and decrypted at runtime by dotenvx. The private key is provided via the `DOTENV_PRIVATE_KEY` environment variable (`.env.keys` does not exist in this sandbox). To run a command with secrets available:

```bash
dotenvx run -- <command>
```

To add or update a secret:

```bash
dotenvx set KEY value
```

Never expose or log secret values. Never write a secret value into any file other than through `dotenvx set`: not into `CONTEXT-MEMORY.md`, code, comments, commit messages or PR descriptions.

## Deployment

Branch previews deploy to Cloudflare Workers. After deployment, the preview URL is written to `.preview-url.md` at the repo root.

```bash
pnpm preview:wrangler   # deploy preview (run from repo root), writes URL to .preview-url.md
```

> ⚠️ **If `.preview-url.md` does not exist after `pnpm preview:wrangler` completes, the deployment failed.** Writing that file is the final step of the command — its absence is a reliable failure signal. Do not proceed to browser verification or screenshots. Diagnose and fix the deployment error first.

Read `.preview-url.md` to get the URL — do not guess or construct it manually.

## Browser Automation

Use `agent-browser` to verify deployed output or test the running dev server.

```bash
agent-browser open <url>
agent-browser snapshot                   # get accessibility tree with element refs
agent-browser click @ref
agent-browser fill @ref "value"
agent-browser screenshot --full <path>
```

Full skill documentation: `.agents/skills/agent-browser/SKILL.md`

## Screenshots

> ⚠️ **Screenshots must be taken from the Cloudflare preview URL, never from localhost.**
> Read `.preview-url.md` after deployment and open that URL before screenshotting.

All verification screenshots **must** be saved to the `screenshots/` folder at the repo root.

Filename format: `YYYYMMDDHHMMSS-<short-title>.png`
Example: `20240315143022-checkout-flow.png`

When referencing a screenshot in task results or comments, always include:

- The filename/path
- A short description of what the screenshot shows
- A confidence score (0–100%) reflecting how well the screenshot demonstrates that the task requirements have been met

Example result comment:

```
Screenshot: screenshots/20240315143022-checkout-flow.png
Description: Cloudflare preview showing the completed checkout flow with all three steps visible and the confirm button enabled.
Confidence: 92% — all acceptance criteria visible; minor responsive layout not tested on mobile.
```

## Verification Workflow

When asked to implement and verify a change:

1. Make the change
2. Use `pnpm dev` during development for fast feedback (localhost is for iteration only)
3. `pnpm build` — confirm no build errors
4. **`git add -A && git commit -m "wip"` — commit all work before deploying.** Deployment can crash the agent and any uncommitted work will be lost. This commit is mandatory before every deploy attempt.
5. `pnpm preview:wrangler` — deploy to Cloudflare (**run from repo root**)
6. Read `.preview-url.md` — this is the only valid URL for verification screenshots

```bash
cat .preview-url.md   # e.g. https://abc123.your-project.workers.dev
```

7. `agent-browser open <url-from-.preview-url.md>` — **use this URL, not localhost**
8. `agent-browser screenshot --full screenshots/YYYYMMDDHHMMSS-<short-title>.png`
9. Confirm the screenshot URL/title bar reflects the Cloudflare domain, not localhost

---

## Pre-PR — COMPLETE THIS BEFORE report_progress

> ❌ **Known failure mode:** Finishing the task and taking screenshots but submitting the PR without the preview URL or without screenshots embedded in the PR description body. Screenshots saved to disk do NOT count. They must be visible inline in the PR description using an absolute GitHub URL.

> ❌ **Known failure mode:** Omitting the `CONTEXT-MEMORY.md` update status from the PR description. This section is mandatory on every PR, even when no update was made.

> ❌ **Known failure mode:** Running `pnpm preview:wrangler` without first committing work. Deployment failures can crash the agent, and any uncommitted changes are lost. Always `git commit` before deploying — even a `wip` commit is fine.

> ❌ **Known failure mode:** Running `pnpm preview:wrangler` and proceeding as if deployment succeeded when `.preview-url.md` was not created. A missing file means the build or deploy failed — not that the URL needs to be constructed manually. Stop and fix the error before continuing.

Before calling `report_progress`, confirm all of the following are true:

- All work was committed to git before `pnpm preview:wrangler` was run.
- You have run `cat .preview-url.md` and have the full Cloudflare URL in hand.
- The full preview URL is pasted as a bare URL in the PR description (not hidden behind link text).
- At least one screenshot was taken from the Cloudflare preview URL (not localhost).
- That screenshot is saved under `screenshots/` with the correct filename format.
- That screenshot is embedded in the PR description using an absolute `raw.githubusercontent.com` URL pointing to this repo and the current branch.
- The PR description includes the `CONTEXT-MEMORY.md` section with update status and a reason.

If any of the above is not true, fix it before proceeding. Do not call `report_progress` with unresolved items.

---

## PR Description Requirements — MANDATORY FOR EVERY PR

Copy the template below and fill in every placeholder. Do not paraphrase or omit sections.

```markdown
- [x] <task summary>

## Preview

<paste the full URL from .preview-url.md here — bare URL, no link text>

## Screenshots

![<short description of what the screenshot shows>](https://raw.githubusercontent.com/<org>/<repo>/<branch>/screenshots/<YYYYMMDDHHMMSS-short-title>.png)

## CONTEXT-MEMORY.md

<Updated — describe which section was changed and what knowledge was added> OR <No update needed — reason>
```

> ⚠️ **The org, repo, and branch in the screenshot URL must be the actual values for this repository and PR branch — not placeholders, not examples, not values from memory.** This file is shared across many repos and orgs; you must derive the correct values from git every time. Run `git remote get-url origin` and `git branch --show-current` to get them.

### Preview URL rules

- Read the URL from `.preview-url.md` — never guess or construct it
- Paste it as a bare URL so it is fully visible to reviewers

> ❌ Wrong: `[Live preview →](https://...)` — URL is hidden behind link text
> ✅ Correct: `https://...` — full URL visible

### Screenshot rules

- Screenshots must come from the Cloudflare preview URL, not localhost
- Embed screenshots using absolute `raw.githubusercontent.com` URLs — relative paths do not render in GitHub PRs before the branch is merged
- The URL must use the **actual org, repo, and branch** derived from git — not values from memory or a previous repo

URL format:

```
https://raw.githubusercontent.com/<org>/<repo>/<branch>/screenshots/YYYYMMDDHHMMSS-short-title.png
```

> ❌ Wrong: `![alt](screenshots/file.png)` — broken image in PR (relative path, branch not yet merged)
> ❌ Wrong: org/repo/branch copied from memory or another repo — always derive from git
> ✅ Correct: `![alt](https://raw.githubusercontent.com/acme-corp/my-actual-repo/feature/my-branch/screenshots/20240315143022-checkout.png)`

### CONTEXT-MEMORY.md rules

Every PR description **must** include a `CONTEXT-MEMORY.md` section, even when no update was made. There is no exception. Omitting it is a checklist failure. A reason is always required.

> ❌ Wrong: omitting the section entirely
> ❌ Wrong: `No update needed` with no reason given
> ✅ Correct: `Updated — added note to Deployment section: DOTENV_PRIVATE_KEY must be set before wrangler deploys or the build silently uses wrong env`
> ✅ Correct: `No update needed — fixed a typo in a button label, no architectural or process knowledge involved`
