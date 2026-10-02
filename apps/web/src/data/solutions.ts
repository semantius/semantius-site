/**
 * The three landing pages (founder's v1 spec, §2, and change request 1). The
 * hub's routing cards, the header's Solutions menu, each landing page's eyebrow
 * and cross-links, and llms.txt read their paths and labels from here.
 */
export interface Solution {
	path: string;
	/** The page's name in the spec's site map, used in the breadcrumbs. */
	name: string;
	/** Who the page is for (change request 1, §3 and §9): the eyebrow, the menu, llms.txt. */
	readerLabel: string;
	/** The hub routing card's link label (change request 1, §3), reused by the cross-links. */
	linkLabel: string;
}

export const SOLUTIONS = {
	guardrails: {
		path: '/solutions/agent-guardrails',
		name: 'Agent guardrails',
		readerLabel: 'For AI engineers',
		linkLabel: 'See how guardrails work',
	},
	crm: {
		path: '/solutions/crm',
		name: 'CRM and operations',
		readerLabel: 'For operations teams',
		linkLabel: 'Build your CRM with your agent',
	},
	apps: {
		path: '/solutions/airtable-alternative',
		name: 'Apps',
		readerLabel: 'For builders and low-code refugees',
		linkLabel: 'Build a custom app',
	},
} satisfies Record<string, Solution>;

export type SolutionKey = keyof typeof SOLUTIONS;
