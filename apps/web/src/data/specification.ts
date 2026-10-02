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
