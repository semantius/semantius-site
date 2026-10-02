/**
 * The specification table (founder's v1 spec, §5.2), shown on Agent guardrails
 * and listed in llms.txt.
 */
export const SPECIFICATION: [string, string][] = [
	['Database', 'PostgreSQL 18+'],
	['Implementation', '100% PL/pgSQL, no external dependencies'],
	['Business rules', 'Extended JSONLogic, stored and evaluated in Postgres; used for validation, computed fields and attribute-based access'],
	['Access control', 'RBAC and ABAC, row-level security on JWTs, enforced for every caller'],
	['Data model', 'Entities with descriptions; relationships with cardinality; subtypes and extensions'],
	['Lifecycles', 'State machines with permission gates'],
	['Audit', 'Every change to data and to the model'],
	['Events', 'pgmq queues with event and rule triggers'],
	['Search', 'Full-text search'],
	['Access', 'PostgREST API; the CLI and agent skill for any agent that can run commands'],
	['App', 'React app generated from the model, in the browser on any device'],
	['Sign-in', 'OAuth2/OIDC with PKCE. Cloud: Google and Microsoft 365 accounts. Self-hosted: Microsoft Entra ID or any JWKS identity provider'],
	['Agent skills', 'Business analyst and data architect playbooks the agent works from'],
	['Backups', 'Cloud backups; point-in-time restore coming soon'],
	['Self-hosting', 'Docker Compose and Dokploy'],
	['License', 'MIT'],
	['Tests', '3,000+ pgTAP tests'],
];

/**
 * The hub's specification table (change request 1, §6). It differs from the
 * one above, which Agent guardrails keeps as built: the hub names no CLI and no
 * test count. Whether the two should become one is open (home-tbd.md, B23).
 */
export const HUB_SPECIFICATION: [string, string][] = [
	['Database', 'PostgreSQL 18+'],
	['Implementation', '100% PL/pgSQL, no external dependencies'],
	['Business rules', 'Extended JSONLogic, stored and evaluated in Postgres: validation, computed fields, attribute-based access'],
	['Access control', 'RBAC and ABAC with row-level security, enforced for every app, API and agent login'],
	['Data model', 'Entities with descriptions; relationships with cardinality; subtypes and extensions'],
	['Lifecycles', 'State machines with permission gates'],
	['Audit', 'Every change to data and to the model'],
	['Events', 'Queues with event and rule triggers; incoming webhooks (Pro)'],
	['Search', 'Full-text search'],
	['API', 'REST API (PostgREST)'],
	['App', 'Generated from the model, in the browser on any device'],
	['Sign-in', 'Cloud: Google and Microsoft 365 accounts. Self-hosted: Microsoft Entra ID or any identity provider with a JWKS endpoint'],
	['Backups', 'Cloud backups; point-in-time restore coming soon'],
	['Self-hosting', 'Docker Compose and Dokploy'],
	['Code', 'None to write or maintain. Business rules are short JSONLogic expressions'],
	['License', 'MIT'],
];
