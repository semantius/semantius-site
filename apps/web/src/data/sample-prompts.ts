/**
 * The six sample prompts (founder's v1 spec, §8). The prompt cards on Agent
 * guardrails and Business apps, the /prompts pages and llms.txt all read them
 * from here, so a prompt cannot differ between two places.
 */
export interface SamplePrompt {
	slug: string;
	heading: string;
	prompt: string;
}

export const SAMPLE_PROMPTS: SamplePrompt[] = [
	{
		slug: 'agency-client-tracker',
		heading: 'A client-and-project tracker for your agency',
		prompt: 'Set up a client-and-project tracker for my agency in Semantius: clients, projects, deadlines and client approvals. Each team member sees only their own clients. Import our client list from this spreadsheet.',
	},
	{
		slug: 'field-service-jobs',
		heading: 'Jobs, crews and maintenance contracts',
		prompt: 'Set up jobs, crews and maintenance contracts in Semantius. Technicians see only their own jobs on their phones. Only I can approve quotes.',
	},
	{
		slug: 'rental-turnovers',
		heading: 'Turnovers for your rentals',
		prompt: 'Set up turnovers for my two rentals in Semantius, shared with my cleaner and my co-host. The cleaner sees only her turnovers and checks them off on her phone.',
	},
	{
		slug: 'punch-list',
		heading: 'A punch list you share with your builder',
		prompt: 'Set up a punch list in Semantius that I share with my builder. Each item has a room, a description, a due date and a status. The builder can mark items done; only I can close them.',
	},
	{
		slug: 'purchase-approvals',
		heading: 'Purchase approvals',
		prompt: 'Set up purchase approvals in Semantius. Only managers can approve purchase requests, and every change is logged.',
	},
	{
		slug: 'equipment-register',
		heading: 'An equipment register',
		prompt: "Set up an equipment register in Semantius: each machine with its location, service dates and who's responsible. Only the maintenance team can change service records.",
	},
];

export const promptPath = (slug: string) => `/prompts/${slug}`;

export function samplePrompt(slug: string): SamplePrompt {
	const found = SAMPLE_PROMPTS.find((p) => p.slug === slug);
	if (!found) throw new Error(`No sample prompt "${slug}"`);
	return found;
}

/** "[Heading] with your AI agent | Semantius" (§10). */
export const promptTitle = (p: SamplePrompt) => `${p.heading} with your AI agent | Semantius`;
