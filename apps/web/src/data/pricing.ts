/**
 * Every pricing fact on /pricing, in one place.
 *
 * Source: the founder's pricing specification of 2026-09-29. The plan cards,
 * the plan table, the worked examples and the JSON-LD offers all read from
 * here, so a price changed in one spot cannot leave another stating the old
 * one.
 *
 * `pending()` marks a figure the founder has not confirmed yet. The page
 * renders it as a visible TBD placeholder (see components/pricing/tbd.ts) and
 * the structured data leaves it out. Never replace one with the specification's
 * "about" figure: an estimate on a pricing page reads as a commitment. The open
 * list lives in todo.md.
 */

/** A value that is still to be confirmed. `tbd` says what is pending. */
export interface Pending {
	tbd: string;
	/** Confirmed wording shown before the placeholder, if any. */
	text?: string;
}

/**
 * One cell of a table or one line of a plan card.
 * `true`/`false` render as a check or a minus, `null` as "not applicable".
 */
export type Cell = string | boolean | null | Pending;

export const pending = (tbd: string, text?: string): Pending => ({ tbd, text });

export const isPending = (value: unknown): value is Pending =>
	typeof value === 'object' && value !== null && 'tbd' in value;

/** "$24", "$13.50": cents only when there are any. */
export const usd = (amount: number): string =>
	`$${amount.toLocaleString('en-US', {
		minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
		maximumFractionDigits: 2,
	})}`;

export const count = (n: number): string => n.toLocaleString('en-US');

/* -------------------------------------------------------------------------- */
/* Cloud plans                                                                */
/* -------------------------------------------------------------------------- */

export interface CloudPlan {
	key: 'free' | 'starter' | 'pro';
	name: string;
	summary: string;
	/** USD per month, billed monthly. */
	monthlyPrice: number;
	/** USD, paid upfront for 12 months. `null`: the plan has no yearly option. */
	yearlyPrice: number | Pending | null;
	/** Credits granted each month. */
	credits: number | Pending;
	/** `null`: no limit. People and agents each count as one user. */
	userLimit: number | null;
	maxComputeUnits: number;
	/** `null`: no limit, storage is paid in credits. */
	storageLimit: string | null;
	topUps: boolean;
	support: Cell;
	webhookReceivers: boolean;
}

export const CLOUD_PLANS: CloudPlan[] = [
	{
		key: 'free',
		name: 'Free',
		summary: 'For personal projects and small groups of up to 5 users.',
		monthlyPrice: 0,
		yearlyPrice: null,
		credits: pending('Free plan monthly credits'),
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
		monthlyPrice: 24,
		yearlyPrice: pending('Starter yearly price'),
		credits: 250,
		userLimit: null,
		maxComputeUnits: 4,
		storageLimit: '1 GB',
		topUps: true,
		support: pending('Starter response-time target, and whether support is forum only', 'Support with a response-time target'),
		webhookReceivers: false,
	},
	{
		key: 'pro',
		name: 'Pro',
		summary: 'For larger workloads, with up to 32 compute units and no storage limit.',
		monthlyPrice: 45,
		yearlyPrice: pending('Pro yearly price'),
		credits: 500,
		userLimit: null,
		maxComputeUnits: 32,
		storageLimit: null,
		topUps: true,
		support: pending('Pro support level and response-time target', 'Support'),
		webhookReceivers: true,
	},
];

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
		title: 'A Small Team',
		who: '6 people and 2 agents, working office hours.',
		usage: { computeUnits: 1, hours: 176, activity: 'office hours', storageGb: 1, egressGb: 3, emails: 1500 },
		plan: 'starter',
		cost: '$24 with 250 credits, plus top-ups for about 540 credits: about $75 to $90 a month, depending on pack size.',
	},
	{
		title: 'A Company',
		who: 'About 50 people with agents, around the clock.',
		usage: { computeUnits: 2, hours: 730, activity: 'around the clock', storageGb: 10, egressGb: 40, emails: 20000 },
		plan: 'pro',
		cost: '$45 with 500 credits, plus top-ups for about 6,400 credits: about $650 a month.',
	},
];
