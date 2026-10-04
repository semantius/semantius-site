# Agent Instructions v2

This file is a draft successor to `AGENTS.md`. It does not replace `AGENTS.md`
until the user says it does. Where the two conflict on scope of work, this
file wins.

## The sentence

Do only what the request asks. Propose everything else (flags, nav, index,
memory, safeguards). Never add it on your own.

That is the whole rule. There is no list of forbidden extras to maintain.
If the user did not ask for a change, it is extra.

## Why a sentence was not enough

`AGENTS.md` already says "do what the user instructs, and only that" and
"never add guards on your own." Agents still add extras because other
sections feel like work: completion checklists, founder-spec rules,
`CONTEXT-MEMORY.md`, "a future session would get this wrong."

Those sections say how to do the asked work. They are not a second
assignment. A deploy gate is not a reason to set `noindex`. A founder spec
rule is not a reason to invent policy on a page that has no founder spec.
A mistake is not a reason to write a standing rule into memory.

## How this is ensured

A markdown file cannot make a model obedient. What it can do is make the
failure recognizable before the extra is committed.

**1. Name the ask.** Before the first edit, state the request in one
sentence, in the user's words. That sentence is the scope. Questions,
complaints, and "why did you..." are not an ask.

**2. The mapping test, before every write.** For each file or flag you are
about to touch, name the words in the request that require it. If you
cannot, stop. Propose it in the reply. Change nothing.

Required process for work the user did ask for still runs (build, commit
before deploy, preview). Process is how you finish the asked work. It is
not a license to add product, SEO, nav, or memory.

**3. Propose in chat, never in the tree.** An extra that might be wise
belongs in the reply as a question. Zero bytes in the repo until the user
says to add it.

**4. Memory is the same rule.** Do not write `CONTEXT-MEMORY.md` unless the
user said to write that text. Finding a "reusable principle" is not
approval. Correcting you is not approval. "Record this" is approval.

**5. Diff before commit.** Every changed path must pass the mapping test.
A comment that encodes a policy the user did not state fails the test.

If a later section of `AGENTS.md` or `CONTEXT-MEMORY.md` seems to demand
something the request did not, do not satisfy it by adding extras. Ask, or
skip that extra and say so.

## What this file is not

It is not a catalog of ideas to ban. The user will not anticipate every
dumb addition. The sentence already excludes them.

It is not permission to ignore `AGENTS.md` on deploy, secrets, or
screenshots. Those still apply when the user asked you to implement and
verify.
