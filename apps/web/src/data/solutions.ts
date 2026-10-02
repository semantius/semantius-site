/**
 * The three solution pages, one per search intent (change request 3, §1): agents,
 * build, outgrown SaaS. The hub's routing cards, the header's Solutions menu,
 * each page's eyebrow and cross-links, and llms.txt read their paths and labels
 * from here, in this order.
 */
export interface Solution {
	path: string;
	/** The page's name in the site map, used in the breadcrumbs. */
	name: string;
	/** Who the page is for: the eyebrow, the menu, the hub card, llms.txt. */
	readerLabel: string;
	/** The hub routing card's link label (change request 3, §2.1), reused by the cross-links. */
	linkLabel: string;
	/** The page's one sentence with its qualifier in llms.txt (change request 3, §7). */
	summary: string;
}

export const SOLUTIONS = {
	guardrails: {
		path: '/solutions/agent-guardrails',
		name: 'Agent guardrails',
		readerLabel: 'For teams putting AI agents to work',
		linkLabel: 'See how guardrails work',
		summary:
			'each agent gets its own login and works within business rules enforced in Postgres, with approvals by the right person, for the rules you define; self-hosted direct database access, a database owner or a superuser can bypass them.',
	},
	backend: {
		path: '/solutions/backend',
		name: 'Back end',
		readerLabel: 'For builders and developers',
		linkLabel: 'See the back end',
		summary:
			"the back end with the rules built in, for builders and developers; everything you self-host is MIT, Pro cloud features aren't.",
	},
	businessApps: {
		path: '/solutions/business-apps',
		name: 'Business apps',
		readerLabel: 'For teams that outgrew their tools',
		linkLabel: 'See business apps',
		summary:
			'for teams that outgrew Airtable, monday, SmartSuite or Power Apps: linked records with rules, an app for the whole team in the browser, paid plans not priced per user; data comes in by CSV import, with no built-in connectors.',
	},
} satisfies Record<string, Solution>;

export type SolutionKey = keyof typeof SOLUTIONS;
