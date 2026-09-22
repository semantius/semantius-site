# Semantius

> Semantius is an agentic data platform built on PostgreSQL. You describe your domain once as a semantic model (entities, fields, relationships, roles and permissions) and Semantius turns that model into a working backend: real Postgres tables, a REST API over every entity, an admin UI your team works in, MCP servers for AI chats, and a CLI with agent skills for coding agents. The core is open source under the MIT license and can be self-hosted for free; app.semantius.com runs it as a managed service.

Until now, a team whose business data has to be usable by both people and AI agents had two options: buy a SaaS product and bend the business to fit it, or build something custom and maintain it forever. Semantius is the third option. The semantic model is the source of truth, and the database schema, the API, the UI and the guardrails agents act under all follow from it. Change the model and they change with it.

## What it is

- **Postgres native.** Every entity you define becomes a real PostgreSQL table, served over HTTP by PostgREST. Role based access control, row level security, validation rules and audit logs are enforced inside PostgreSQL itself, not in an application tier in front of it. Your data stays in a database you can query, back up and take with you.
- **One model, four surfaces.** The same semantic model drives the database, the REST API, the UI people work in, and the tools agents call. There is no second schema to keep in sync.
- **A UI for humans, not just an API for agents.** Dashboards, forms, grids and charts are generated from the model, so the people who own the data can work with it directly.
- **Guardrails for agents by default.** An agent acts through the same permissions, validation rules and row level select rules as any user. Granting an agent access is not the same as handing it unrestricted SQL.
- **Business logic lives in the model.** Computed fields, validation rules and row level rules are JsonLogic expressions stored alongside the model, so they version and diff with it.
- **Open source, MIT.** The core (the `pg_semantius` PostgreSQL extension and its CLI), the web app, the bundled identity provider and the self-hosted stack are all MIT licensed: https://github.com/Semantius

## How you run it

- **Self-hosted, free.** https://github.com/Semantius/semantius-self-hosted brings up the whole stack with one command: PostgreSQL 18 with the `pg_semantius` extension, PostgREST with OpenAPI docs, a bundled OIDC identity provider, the web app and a reverse proxy. No account, no license fee.
- **On managed Postgres.** The core also runs on hosted providers such as Neon and Supabase through the CLI, for cases where a custom PostgreSQL extension is not available.
- **Managed cloud.** https://app.semantius.com provisions and operates a platform for you if you would rather not run Postgres, the API and the identity provider yourself. Plans: https://www.semantius.com/pricing

## Who works with it

- **People** use the admin UI: dashboards, forms, grids and charts generated from the model.
- **AI chats** (ChatGPT, Claude, any MCP client) connect through the Semantius MCP servers to ask questions grounded in the semantic model, create and update records under the model's permissions, and evolve the schema in natural language.
- **Coding agents** (Claude Code, OpenClaw, any agent that supports Agent Skills) use the `semantius` CLI and the Semantius agent skills to introspect schemas, query data, apply model changes and deploy them.

## Getting started

1. Self-host the stack, or create a platform at https://app.semantius.com
2. Install the MCP servers so any MCP compatible client can reach your platform: https://www.semantius.com/docs/mcp-connectors/installation.md
3. Install the CLI and the agent skills in your coding agent: https://www.semantius.com/docs/agent-skills/installation.md
4. Deploy a blueprint from the catalog, or build a model from scratch with the Business Analyst skill: https://www.semantius.com/docs/models/create.md

## Machine-readable formats

Every page on this site is also published as markdown, at the same path with
".md" appended:

    https://www.semantius.com/pricing         ->  https://www.semantius.com/pricing.md
    https://www.semantius.com/docs/cli        ->  https://www.semantius.com/docs/cli.md
    https://www.semantius.com/                ->  https://www.semantius.com/index.md

Each HTML page advertises its own twin with
`<link rel="alternate" type="text/markdown" href="...">`. Every link below
points at the markdown form, so you can follow them without leaving markdown.

An index of the documentation, blog and blueprint twins is at
https://www.semantius.com/llms-full.txt

Blueprints additionally publish their complete source specification, YAML
frontmatter included, at https://www.semantius.com/blueprints/source/<file-id>.md
