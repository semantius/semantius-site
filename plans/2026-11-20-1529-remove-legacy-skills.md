# Plan: remove legacy skills from the site

Related: [2026-11-20-1516-business-logic-docs.md](2026-11-20-1516-business-logic-docs.md)
(its Deploy items moved here).

**Status (reviewed 2026-11-21): nothing started.** The owner stated on
2026-11-20 that the Deploy skill (`/semantic-model-deployer`) is legacy. The
skills repositories, updated on 2026-11-20 and 2026-11-21, now answer which
skills exist (below). What the docs say about the current skills, and where
retired pages redirect, is still the owner's to decide (open questions). No
step starts before they are answered, and nothing is written that the owner has
not given or approved (`CONTEXT-MEMORY.md`, "Stop and ask; never infer").

## The skills that exist today

Two repositories ship them:

- **The `semantius` plugin**, `c:\dev\semantius-agent\semantius-plugin`
  (`.claude-plugin/plugin.json`, name `semantius`, slash commands
  `/semantius:*`). Its README lists eight skills and a pipeline:

  | Skill | Does |
  |---|---|
  | `semantius-architect` | designs a `*-semantic-blueprint.md`: entities, roles, lifecycle, permissions, no fields |
  | `semantius-analyst` | turns a blueprint into a deployable `*-semantic-spec.md`: reuse decisions, fields, validation rules |
  | `semantius-modeler` | deploys a spec to a live instance through the CLI |
  | `semantius-admin` | orchestrates the pipeline, and admin verbs (status, list, health) |
  | `semantius-importer` | loads a CSV into an entity |
  | `semantius-optimizer` | reverse-engineers a spec from a live module |
  | `semantius-transfer` | moves modules and tables between hosts; backup and restore |
  | `use-semantius` | shared CLI patterns and platform reference |

  Commands: `/semantius:get-started`, `/semantius:deploy`, `/semantius:build`,
  `/semantius:clone`, `/semantius:audit`, `/semantius:status`,
  `/semantius:backup`, `/semantius:health` (`semantius-plugin/commands/`).
  Artifacts land in `semantius/blueprints/` and `semantius/specs/` of the
  customer's repository. The spec format is
  `skills/semantius-analyst/references/semantic-spec-template.md`; the
  architecture is `semantius-plugin/docs/architecture.md`.
- **The CLI**, `c:\dev\semantius-cli\skills`: `use-semantius`,
  `semantius-importer`, `semantius-transfer`, installed with
  `npx skills add semantius/semantius-cli -g` (`semantius-cli/README.md` 44-85).

The site's own code already uses the new names in two places:
`apps/web/src/lib/blueprint-deploy.ts` 15-16 (`/semantius-admin use the
architect, analyst and modeler skills ...`, on every blueprint page and twin)
and the template pages (`components/common/Command.astro` 7-19).

## Old to new

None of the skills the docs describe is shipped. By the descriptions of the
skills above, the nearest current equivalents are (to be confirmed by the
owner, question 1):

| In the docs | Slash command | Docs page | Nearest today |
|---|---|---|---|
| Deployer (legacy, owner 2026-11-20) | `/semantic-model-deployer` | `models/deploy.mdx` | `semantius-modeler`, `/semantius:deploy` |
| Business Analyst | `/semantic-model-analyst` | `models/create.mdx` | `semantius-architect` then `semantius-analyst`, `/semantius:build` |
| Optimizer | `/semantic-model-optimizer` | `models/optimize.mdx` | `semantius-optimizer` |
| Schema Editor | none | none | `use-semantius` (entities and fields) |
| RBAC Configurator | none | none | `use-semantius` (permissions and roles) |
| use-semantius (CLI) | none | `cli/use-semantius.mdx` | unchanged |

The model file changed as well. `models/structure.mdx` documents one
`*-semantic-model.md` (eight sections, ending in "Implementation notes for the
downstream agent", read by the Deployer). Today there are two files: the
blueprint (nine sections, the format of every file under `blueprints/`) and
the spec (`semantic-spec-template.md`), which carries the fields and the
validation rules.

## Findings

### Pages built on the old skills

- `models/deploy.mdx`: the whole page, with four `/semantic-model-deployer`
  commands (16-22).
- `models/create.mdx` (`/semantic-model-analyst`, 10-46) and
  `models/optimize.mdx` (`/semantic-model-optimizer`, 10-37).
- `models/structure.mdx`: the old file format. "the Deployer skill consumes
  it" (10); the deployer at 41, 44, 104, 139, 185, 193, 219 and 230; section 8
  (198-224) is "a step-by-step recipe for the Deployer skill". Its
  validation-rule example (112-139) uses a code the platform refuses (90905), a
  `description` key the platform does not read (it reads `hint`), and says it
  is "taken verbatim from the ATS model", which no blueprint carries.
- `models/templates.mdx`: `/semantic-model-deployer` (15), "Hand the template
  URL ... to the Deploy skill" (23), `/semantic-model-analyst` (17, 27). The
  site also has its own template pages (`src/pages/templates/`), built from
  `domain-list-site.json`, which use the new prompt.
- `agent-skills/index.mdx` (the skill list, 13-17; "Deploy →", 43) and
  `agent-skills/installation.mdx` (the skill list, 72; "Use the Schema Editor
  skill ...", 80; "Deploy →", 90). Installation also has to match the two
  install paths above (the plugin, and `npx skills add` for the CLI skills).

### Links and mentions

- `cli/command.mdx` 293 and `cli/use-semantius.mdx` 119: the old skill list.
- `models/index.mdx` 29, 37; `overview/index.mdx` 42; `reference/index.mdx` 23.
- `business-logic/index.mdx` 45 (Business Analyst and Deploy) and 50
  (Optimize).

### Code

- `components/common/Command.astro` 24-29: `SKILL_DOC_MAP` links the three
  `/semantic-model-*` commands to their docs pages.
- `pages/features.astro` 53: "Data Analyst skill ... Model Deployer skill
  reconciling the platform with the model."
- `astro.config.mjs` 457-479 redirects old URLs to `/docs/models/create`,
  `deploy`, `optimize` and `structure`. A retired page needs a redirect of its
  own, and the old URLs need the new target, so links from outside do not end
  on a 404.
- Generated output follows the sources: the markdown twins, `llms.txt`,
  `llms-full.txt` and the search index.

### Broken examples, today

- `/models/saas_expense_tracker/model` (`models/index.mdx` 29,
  `models/structure.mdx` 234) redirects to the `/blueprints` index:
  `saas_expense_tracker` is in the legacy slug list (`astro.config.mjs`
  500-513).
- `https://www.semantius.com/models/saas_expense_tracker-semantic-model.md`
  (`models/create.mdx` 42, `models/deploy.mdx` 18, `models/templates.mdx` 15,
  17) returns 404 (checked on the preview of 2026-11-20).

### Outside this repository

- The mirrored skills `skills/use-*/references/discovery.md` 238 still show a
  validation rule with a slug code, which the platform refuses (90905). They
  are generated elsewhere and fixed upstream (`CONTEXT-MEMORY.md`, "Content
  that does not originate in this repo").

## Open questions for the owner

1. **The mapping.** Is the "Old to new" table right, and are all five old
   skills retired?
2. **What the docs say about the new skills.** Pages for the plugin and its
   pipeline do not exist yet. Who writes the copy, from which sources (the
   plugin README, `docs/architecture.md`, the skill descriptions)? Until it
   exists, does a retired page become a visible TBD
   (`components/common/Tbd.astro`) or a redirect?
3. **The file format.** Does `models/structure.mdx` become a page about the
   blueprint and the spec, or does it go?
4. **Redirect targets** for `/docs/models/deploy`, `create`, `optimize` and
   `structure`, and for the old URLs pointing at them.
5. **`models/templates.mdx`** against the site's own template pages: keep,
   merge, or redirect to `/templates`?

## Steps (once the questions are answered)

1. Remove or rewrite the retired pages, and add a redirect for each, including
   the old URLs that point at them (`astro.config.mjs` 457-479).
2. Rewrite or remove every link and mention listed above, and the
   installation page against the two install paths.
3. Update `SKILL_DOC_MAP` in `Command.astro` and the features card text.
4. Replace the broken example URLs with a blueprint that exists.
5. Rewrite or retire `models/structure.mdx` (question 3), including its
   validation-rule example.
6. `git grep` for every retired slash command, page path and skill name, to
   confirm none is left outside the mirrors.

## Verification

1. `pnpm build` from the repo root (`pnpm lint` is a no-op), then the grep of
   step 6 on `apps/web/dist` as well.
2. Stage only the changed files by path (never `git add -A`: `plans/` and
   `screenshots/` stay untracked) and `git commit -m "wip: ..."` before
   deploying.
3. `pnpm preview:wrangler`; read `.preview-url.md`. A missing file means the
   deploy failed.
4. On the preview: every retired URL redirects, the changed pages render, the
   `.md` twins and `llms.txt` no longer name a retired skill, and screenshots
   go to `screenshots/` as `YYYYMMDDHHMMSS-<title>.png`.
