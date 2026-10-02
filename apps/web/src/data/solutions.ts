/**
 * The three landing pages (founder's v1 spec, §2). The hub's routing cards, the
 * header's Solutions menu, each landing page's cross-links and llms.txt read
 * their paths and labels from here.
 */
export interface Solution {
	path: string;
	/** The page's name in the spec's site map, used in the menu and breadcrumbs. */
	name: string;
	/** The hub routing card's button label (§4.4), reused by the cross-links. */
	linkLabel: string;
}

export const SOLUTIONS = {
	guardrails: {
		path: '/solutions/agent-guardrails',
		name: 'Agent guardrails',
		linkLabel: 'See how rules are enforced',
	},
	crm: {
		path: '/solutions/crm',
		name: 'CRM and operations',
		linkLabel: 'Build your CRM with your agent',
	},
	apps: {
		path: '/solutions/airtable-alternative',
		name: 'Apps',
		linkLabel: 'Build an app',
	},
} satisfies Record<string, Solution>;

export type SolutionKey = keyof typeof SOLUTIONS;
