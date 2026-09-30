/**
 * Every pricing fact on /pricing, in one place.
 *
 * Sources: the founder's pricing specification of 2026-09-29, the founder's
 * answers to the v1 review of the page, and the public copy of the self-hosted
 * support offer. The plan cards, the plan table, the worked examples and the
 * JSON-LD offers all read from here, so a price changed in one spot cannot
 * leave another stating the old one.
 *
 * A detail that is not decided is left out, never shown as a placeholder: an
 * estimate on a pricing page reads as a commitment, and a "TBD" reads as
 * unfinished. What is still open is listed in todo.md.
 */

/**
 * One cell of a table or one line of a plan card.
 * `true`/`false` render as a check or a minus, `null` as "not applicable".
 */
export type Cell = string | boolean | null;

/** "$24", "$13.50": cents only when there are any. */
export const usd = (amount: number): string =>
	`$${amount.toLocaleString('en-US', {
		minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
		maximumFractionDigits: 2,
	})}`;

export const count = (n: number): string => n.toLocaleString('en-US');

/** Where the Free plan's Sign up button goes. No query parameters: the app reads none. */
export const SIGN_UP_URL = 'https://app.semantius.com/auth/sign-up';

/* -------------------------------------------------------------------------- */
/* Cloud plans                                                                */
/* -------------------------------------------------------------------------- */

export interface CloudPlan {
	key: 'free' | 'starter' | 'pro';
	name: string;
	summary: string;
	/** `available` gets a Sign up button; `coming-soon` a badge and the wait list. */
	status: 'available' | 'coming-soon';
	/** USD per month, billed monthly. */
	monthlyPrice: number;
	/**
	 * USD, paid upfront for 12 months. `null` until the founder sets it. The
	 * billing toggle and the yearly table row appear once any plan has one.
	 */
	yearlyPrice: number | null;
	/** Credits granted each month. */
	credits: number;
	/** `null`: no limit. People and agents each count as one user. */
	userLimit: number | null;
	maxComputeUnits: number;
	/** `null`: no limit, storage is paid in credits. */
	storageLimit: string | null;
	topUps: boolean;
	support: string;
	webhookReceivers: boolean;
}

export const CLOUD_PLANS: CloudPlan[] = [
	{
		key: 'free',
		name: 'Free',
		summary: 'For personal projects and small groups of up to 5 users.',
		status: 'available',
		monthlyPrice: 0,
		yearlyPrice: null,
		credits: 200,
		userLimit: 5,
		maxComputeUnits: 1,
		storageLimit: '500 MB',
		topUps: false,
		support: 'Documentation only',
		webhookReceivers: false,
	},
	{
		key: 'starter',
		name: 'Starter',
		summary: 'For teams of any size, with no limit on users.',
		status: 'coming-soon',
		monthlyPrice: 24,
		yearlyPrice: null,
		credits: 250,
		userLimit: null,
		maxComputeUnits: 4,
		storageLimit: '1 GB',
		topUps: true,
		// The response-time targets for Starter and Pro are not decided, so both
		// say "Support" rather than one of them implying a better level.
		support: 'Support',
		webhookReceivers: false,
	},
	{
		key: 'pro',
		name: 'Pro',
		summary: 'For larger workloads, with up to 32 compute units and no storage limit.',
		status: 'coming-soon',
		monthlyPrice: 45,
		yearlyPrice: null,
		credits: 500,
		userLimit: null,
		maxComputeUnits: 32,
		storageLimit: null,
		topUps: true,
		support: 'Support',
		webhookReceivers: true,
	},
];

export const HAS_YEARLY = CLOUD_PLANS.some((p) => p.yearlyPrice !== null);

/* -------------------------------------------------------------------------- */
/* Credits                                                                    */
/* -------------------------------------------------------------------------- */

/** Credits per unit. One credit is one compute unit for 15 minutes. */
export const RATES = {
	computeUnitHour: 4,
	storageGbMonth: 20,
	egressGb: 12,
	thousandEmails: 20,
} as const;

export const CREDIT_RATES = [
	{ what: 'Compute', unit: '1 compute unit for 1 hour', credits: RATES.computeUnitHour },
	{ what: 'Data storage', unit: '1 GB for a month', credits: RATES.storageGbMonth },
	{ what: 'Egress (data transfer out)', unit: '1 GB', credits: RATES.egressGb },
	{ what: 'Emails sent', unit: '1,000 emails', credits: RATES.thousandEmails },
];

export const TOP_UP_PACKS = [
	{ credits: 100, price: 13.5 },
	{ credits: 200, price: 22 },
	{ credits: 1250, price: 119 },
];

/** Stated in "How credits work" and in the FAQ, so the two cannot drift. */
export const AT_ZERO_CREDITS =
	"When your credits are used up, your database stops until you top up (on Starter and Pro) or your next month's credits arrive. You are warned before that happens.";

/**
 * Where Pro starts to cost less than Starter plus top-ups. Pro's 500 credits
 * for $45 cost $0.09 each; top-ups cost $0.095 to $0.135. So between 250 and
 * 500 credits a month, Starter plus top-ups passes $45 somewhere between about
 * 405 (100-credit packs) and 470 (1,250-credit packs). Redo this if a price,
 * a plan's credits or a pack changes.
 */
export const PRO_BREAK_EVEN_CREDITS = 450;

/* -------------------------------------------------------------------------- */
/* Worked examples                                                            */
/* -------------------------------------------------------------------------- */

export interface Usage {
	computeUnits: number;
	/** Hours a month the database is active. */
	hours: number;
	/** How those hours come about, in words. */
	activity: string;
	storageGb: number;
	egressGb: number;
	emails: number;
}

export interface WorkedExample {
	title: string;
	who: string;
	usage: Usage;
	/** The cheapest plan for this usage, not merely one that fits. */
	plan: CloudPlan['key'];
	/**
	 * Written out rather than computed: the range depends on which top-up pack
	 * a customer buys. Worked from RATES and TOP_UP_PACKS as they stand; redo
	 * the sums if either changes.
	 */
	cost: string;
}

/** Credits a month for a usage profile, line by line. */
export function usageCredits(u: Usage) {
	const compute = u.computeUnits * u.hours * RATES.computeUnitHour;
	const storage = u.storageGb * RATES.storageGbMonth;
	const egress = u.egressGb * RATES.egressGb;
	const email = (u.emails / 1000) * RATES.thousandEmails;
	return { compute, storage, egress, email, total: compute + storage + egress + email };
}

export const WORKED_EXAMPLES: WorkedExample[] = [
	{
		title: 'One Person With an Agent',
		who: 'A snag list or a rental tracker, shared with a helper.',
		usage: { computeUnits: 1, hours: 30, activity: 'about 1 hour of activity a day', storageGb: 0.3, egressGb: 0.5, emails: 300 },
		plan: 'free',
		cost: '$0 a month.',
	},
	{
		// 790 credits: Pro plus 290 in top-ups ($73 to $81) undercuts Starter
		// plus 540 ($75 to $90). See PRO_BREAK_EVEN_CREDITS.
		title: 'A Small Team',
		who: '6 people and 2 agents, working office hours.',
		usage: { computeUnits: 1, hours: 176, activity: 'office hours', storageGb: 1, egressGb: 3, emails: 1500 },
		plan: 'pro',
		cost: '$45 with 500 credits, plus top-ups for about 290 credits: about $73 to $81 a month, depending on pack size.',
	},
	{
		title: 'A Company',
		who: 'About 50 people with agents, around the clock.',
		usage: { computeUnits: 2, hours: 730, activity: 'around the clock', storageGb: 10, egressGb: 40, emails: 20000 },
		plan: 'pro',
		cost: '$45 with 500 credits, plus top-ups for about 6,400 credits: about $650 a month.',
	},
];

/* -------------------------------------------------------------------------- */
/* Self-hosted support                                                        */
/* -------------------------------------------------------------------------- */

// From the public copy of the support offer. Its Community channel also named
// Discord; there is no Semantius Discord, so only GitHub Discussions is listed,
// and Discussions are enabled on Semantius/semantius alone.

export const SUPPORT_HOURS = '09:00 to 17:00 US Eastern, Monday to Friday';

export interface SupportTier {
	name: string;
	/** USD per year, or the wording shown in place of a price. */
	price: number | string;
	lines: string[];
	link?: { label: string; href: string };
}

export const SUPPORT_TIERS: SupportTier[] = [
	{
		name: 'Community',
		price: 'Free',
		lines: ['Help from the community on GitHub Discussions', 'No response target'],
		link: { label: 'Open GitHub Discussions', href: 'https://github.com/Semantius/semantius/discussions' },
	},
	{
		name: 'Standard',
		price: 1800,
		lines: ['Email and tickets', 'P1 response within 2 business days', '1 named contact', 'Security advisories'],
	},
	{
		name: 'Priority',
		price: 6000,
		lines: [
			'Email and a private shared channel',
			'P1 response within 1 business day',
			'3 named contacts',
			'Security advisories',
			'One architecture review a year',
		],
	},
	{
		name: 'Enterprise',
		price: 'By negotiation',
		lines: ['IP indemnification', 'Negotiated liability terms'],
	},
];

export const RESPONSE_TARGETS = [
	{ severity: 'P1', meaning: 'Production down, or data at risk', standard: '2 business days', priority: '1 business day' },
	{ severity: 'P2', meaning: 'Major function impaired, no workaround', standard: '3 business days', priority: '2 business days' },
	{ severity: 'P3', meaning: 'Minor issue, workaround available', standard: '5 business days', priority: '5 business days' },
	{ severity: 'P4', meaning: 'Question, guidance, configuration', standard: '5 business days', priority: '5 business days' },
];

/** What a support plan covers, and what is billed as a service instead. */
export const SUPPORT_COVERAGE: { activity: string; support: Cell; services: Cell }[] = [
	{ activity: 'Diagnosing defects in the unmodified pg_semantius extension, the app, or the published self-hosted stack', support: true, services: false },
	{ activity: 'Security advisories and hotfixes', support: true, services: false },
	{ activity: 'Startup, configuration and upgrade troubleshooting for the published Docker Compose stack', support: true, services: false },
	{ activity: 'Environment variable, identity provider and JWKS configuration for the published stack', support: true, services: false },
	{ activity: 'Migration and upgrade guidance along the published pg_semantius migrate path', support: true, services: false },
	{ activity: 'Explaining how the catalog, rule engine and audit trail behave', support: true, services: false },
	{ activity: 'Designing or debugging your own model: entities, fields, rules, JsonLogic, workflows', support: false, services: true },
	{ activity: 'Your application code, custom clients or your own MCP servers', support: false, services: true },
	{ activity: 'Your operating system, VM, cloud account, network, firewall, TLS certificates or backups', support: false, services: true },
	{ activity: "Postgres tuning beyond the extension's own queries", support: false, services: true },
	{ activity: 'Configuration inside your identity provider', support: false, services: true },
	{ activity: 'Any deployment modified from the published distribution', support: false, services: 'Best effort' },
	{ activity: 'Recovering data lost through changes made outside the product', support: false, services: 'Best effort' },
	{ activity: 'On-site work', support: false, services: 'Not offered' },
];

export const HOURLY_RATE = 250;

export const SERVICES = [
	{
		name: 'Deployment Check',
		price: 750,
		scope: 'up to 3 hours',
		text: 'One working session over your deployment: your Compose or Kubernetes configuration, your reverse proxy and TLS, and your identity provider and JWKS wiring. You hear what should change, and get a short written summary rather than a report. There is no preparation pass, Postgres sizing or backup design. Findings may be used anonymously to improve the product and its documentation.',
	},
	{
		name: 'Deployment Review',
		price: 2500,
		scope: 'up to 10 hours',
		text: 'A preparation pass over your configuration, a working session with your team, and a written report. It covers your Compose or Kubernetes configuration, reverse proxy and TLS, identity provider and JWKS wiring, backup and restore plan, and Postgres sizing for your number of users.',
	},
];
