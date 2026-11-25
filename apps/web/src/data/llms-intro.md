# Semantius

> Semantius is the agent-first data platform: a system of record that AI agents and people work in together. A business's records, business rules (JSONLogic evaluated in PostgreSQL), approval steps and permissions live in Postgres and are checked on every change, from the app, the API or any agent's own login. Any agent that can run commands, such as the always-on agents Meta Muse, OpenAI Dots and Grok Bot, or coding agents such as Claude Code, Codex, OpenClaw and Hermes Agent, sets the system up and works in it through the Semantius CLI and skill. People use a web app generated from the same model. The core is MIT-licensed and can be self-hosted.

## What you can build

Anything that needs its own records, from one table to a full system of record
such as a CRM or an ITSM. After Install, the user describes it in plain words,
for example "Track our software licenses and when they renew", and the
use-semantius skill builds it: it shows the list of entities and waits for the
user's confirmation before the first write. For ideas, see Templates.

## Machine-readable formats

Every page on this site is also published as markdown, at the same path with
".md" appended:

    https://www.semantius.com/docs/cli        ->  https://www.semantius.com/docs/cli.md
    https://www.semantius.com/about           ->  https://www.semantius.com/about.md
    https://www.semantius.com/                ->  https://www.semantius.com/index.md

Rather than guessing a URL, follow the links below or read the page's own
`<link rel="alternate" type="text/markdown">`: both only ever name twins that
exist.
