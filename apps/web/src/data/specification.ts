/**
 * The specification table (founder's v1 spec, §5.2), shown on Agent guardrails
 * and listed in llms.txt.
 *
 * The optional third value is the docs slug of the page that backs the row (the
 * URL under /docs/). llms.txt links the row's name to that page's markdown twin,
 * so an agent can go from a claim to its documentation. Agent guardrails does
 * not show it.
 */
export const SPECIFICATION: [name: string, value: string, docsSlug?: string][] = [
	['Database', 'PostgreSQL 18+', 'pg-semantius'],
	['Implementation', '100% PL/pgSQL, no external dependencies', 'pg-semantius'],
	['Business rules', 'Extended JSONLogic, stored and evaluated in Postgres; used for validation, computed fields and attribute-based access', 'business-logic'],
	['Access control', 'RBAC and ABAC, row-level security on JWTs, enforced for every caller', 'permissions-and-roles'],
	['Data model', 'Entities with descriptions; relationships with cardinality; subtypes and extensions', 'entities-and-fields'],
	['Lifecycles', 'State machines with permission gates', 'workflow-and-access'],
	['Audit', 'Every change to data and to the model', 'audit-logs'],
	['Events', 'pgmq queues with event and rule triggers', 'pg-semantius'],
	['Search', 'Full-text search', 'entities-and-fields/fields'],
	['Access', 'PostgREST API; the CLI and agent skill for any agent that can run commands', 'cli'],
	['App', 'React app generated from the model, in the browser on any device', 'app'],
	['Sign-in', 'OAuth2/OIDC with PKCE. Cloud: Google and Microsoft 365 accounts. Self-hosted: Microsoft Entra ID or any JWKS identity provider', 'users-and-agents'],
	['Agent skills', 'Business analyst and data architect playbooks the agent works from', 'agent-skills'],
	['Backups', 'Cloud backups; point-in-time restore coming soon'],
	['Self-hosting', 'Docker Compose and Dokploy', 'self-hosted'],
	['License', 'MIT'],
	['Tests', '3,000+ pgTAP tests'],
];

