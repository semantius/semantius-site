/**
 * Scripted roster and timeline for the /botsim proof of concept.
 *
 * The layout follows the Grok Bot home page workspace: a sidebar of named
 * agents and a chat for the one in view. The copy is Semantius-flavored so
 * the page is not a brand clone.
 */

export type BotStatus = 'idle' | 'thinking' | 'typing' | 'working';
export type AvatarShape = 'circle' | 'triangle' | 'group';

export interface ChatMessage {
	id: string;
	from: 'bot' | 'you' | 'tool';
	text: string;
}

export interface BotSeed {
	id: string;
	name: string;
	job: string;
	color: string;
	color2?: string;
	shape: AvatarShape;
	preview: string;
	time: string;
	status: BotStatus;
	messages: ChatMessage[];
}

export type SimEvent =
	| { wait: number; select: string }
	| { wait: number; bot: string; status: BotStatus }
	| { wait: number; bot: string; preview: string; time?: string }
	| { wait: number; bot: string; message: Omit<ChatMessage, 'id'>; preview: string };

export const BOTS: BotSeed[] = [
	{
		id: 'chief',
		name: 'Chief of Staff',
		job: 'Coordination',
		color: '#10b981',
		shape: 'circle',
		preview: 'booked the venue and sent the agenda',
		time: '3:43 PM',
		status: 'idle',
		messages: [
			{
				id: 'chief-1',
				from: 'you',
				text: 'Plan the Q4 offsite. I approve the venue and the budget.',
			},
			{
				id: 'chief-2',
				from: 'tool',
				text: 'Opened the venue calendar',
			},
			{
				id: 'chief-3',
				from: 'bot',
				text: 'Venue holds 40 and is free October 16 to 18. Agenda draft is in the thread. Budget is $18,400. I need your approval on the venue.',
			},
		],
	},
	{
		id: 'new-agent',
		name: 'New agent',
		job: 'Intake',
		color: '#f59e0b',
		shape: 'circle',
		preview: 'Typing...',
		time: '11:43 PM',
		status: 'thinking',
		messages: [],
	},
	{
		id: 'inbox',
		name: 'Inbox Manager',
		job: 'Support queue',
		color: '#3b82f6',
		shape: 'triangle',
		preview: 'inbox at zero, 5 drafts parked',
		time: '8:43 PM',
		status: 'idle',
		messages: [
			{
				id: 'inbox-1',
				from: 'you',
				text: 'Clear the support queue. Draft replies in my voice. Do not send them.',
			},
			{
				id: 'inbox-2',
				from: 'tool',
				text: 'Signed in to the ticket queue',
			},
			{
				id: 'inbox-3',
				from: 'bot',
				text: 'Queue is at zero. Five replies are drafted and waiting on you. Nothing was sent.',
			},
		],
	},
	{
		id: 'account',
		name: 'Account Manager',
		job: 'Renewals',
		color: '#8b5cf6',
		shape: 'circle',
		preview: 'invited Vicky, noted the deal',
		time: '6:43 PM',
		status: 'idle',
		messages: [
			{
				id: 'account-1',
				from: 'you',
				text: 'Follow up on the Acme renewal. Same thread as last quarter.',
			},
			{
				id: 'account-2',
				from: 'bot',
				text: 'Acme replied on pricing. They only sign annual, and Dana is the one who approves. I invited Vicky and left the note on the deal.',
			},
		],
	},
	{
		id: 'talent',
		name: 'Talent Scout',
		job: 'Hiring',
		color: '#2563eb',
		shape: 'circle',
		preview: '3 intros drafted in your voice',
		time: '3:43 PM',
		status: 'idle',
		messages: [
			{
				id: 'talent-1',
				from: 'you',
				text: 'Source three backend candidates. Draft intros in my voice. Hold them for review.',
			},
			{
				id: 'talent-2',
				from: 'tool',
				text: 'Opened the hiring pipeline',
			},
			{
				id: 'talent-3',
				from: 'bot',
				text: 'Three intros are drafted in your voice and held for review. Scores and notes are on each candidate record.',
			},
		],
	},
	{
		id: 'expense',
		name: 'Expense Manager',
		job: 'Expenses',
		color: '#f97316',
		shape: 'circle',
		preview: 'report filed, 9 receipts, nothing out of policy',
		time: '7:43 PM',
		status: 'idle',
		messages: [
			{
				id: 'expense-1',
				from: 'you',
				text: 'File last week of receipts. Flag anything out of policy.',
			},
			{
				id: 'expense-2',
				from: 'bot',
				text: 'Report is filed. Nine receipts, nothing out of policy. Ready for your sign-off.',
			},
		],
	},
	{
		id: 'offsite',
		name: 'Offsite crew',
		job: 'Group thread',
		color: '#14b8a6',
		color2: '#8b5cf6',
		shape: 'group',
		preview: 'leaves the pipeline. I will spin up the next step.',
		time: '5:43 PM',
		status: 'idle',
		messages: [
			{
				id: 'offsite-1',
				from: 'you',
				text: 'Chief of Staff owns the venue. Talent Scout covers travel. Come back if a date slips.',
			},
			{
				id: 'offsite-2',
				from: 'bot',
				text: 'Talent Scout leaves the pipeline once travel holds are in. I will spin up the next step if a date slips.',
			},
		],
	},
];

/**
 * A looping demo reel. Other agents keep working while one is in view,
 * which is the point of the original homepage simulation.
 */
export const PLAYLIST: SimEvent[] = [
	{ wait: 900, bot: 'new-agent', status: 'thinking' },
	{ wait: 1400, bot: 'new-agent', status: 'typing' },
	{
		wait: 1800,
		bot: 'new-agent',
		message: {
			from: 'you',
			text: 'Stand up a quotes model. I approve every quote. You prepare them.',
		},
		preview: 'stand up a quotes model...',
	},
	{ wait: 900, bot: 'new-agent', status: 'thinking' },
	{ wait: 1200, bot: 'new-agent', status: 'working' },
	{
		wait: 1600,
		bot: 'new-agent',
		message: { from: 'tool', text: 'Read the active data dictionary' },
		preview: 'reading the data dictionary',
	},
	{
		wait: 2000,
		bot: 'new-agent',
		message: {
			from: 'bot',
			text: 'Clients and Quotes are in the model. Hours must be greater than 0. I can prepare a quote. I cannot mark it approved.',
		},
		preview: 'Clients and Quotes are in the model',
	},
	{ wait: 800, bot: 'new-agent', status: 'idle' },
	{ wait: 1600, select: 'inbox' },
	{ wait: 700, bot: 'inbox', status: 'working' },
	{
		wait: 1500,
		bot: 'inbox',
		preview: 'checking the overnight queue',
		message: { from: 'tool', text: 'Checked the overnight queue' },
	},
	{
		wait: 1800,
		bot: 'inbox',
		preview: 'inbox at zero, 5 drafts parked',
		message: {
			from: 'bot',
			text: 'Two new tickets arrived overnight. Both have drafts parked next to the first five. Still waiting on you to send.',
		},
	},
	{ wait: 600, bot: 'inbox', status: 'idle' },
	{ wait: 1400, select: 'account' },
	{ wait: 800, bot: 'account', status: 'typing' },
	{
		wait: 2000,
		bot: 'account',
		preview: 'Dana is the one who approves',
		message: {
			from: 'bot',
			text: 'Dana asked for the annual number in writing. Draft is on the deal. I will not send it until you say so.',
		},
	},
	{ wait: 500, bot: 'account', status: 'idle' },
	{ wait: 1200, select: 'talent' },
	{ wait: 700, bot: 'talent', status: 'working' },
	{
		wait: 1700,
		bot: 'talent',
		preview: 'held a fourth intro for review',
		message: {
			from: 'bot',
			text: 'A fourth candidate cleared the bar. Intro is drafted and held. Three plus this one are waiting on you.',
		},
	},
	{ wait: 500, bot: 'talent', status: 'idle' },
	{ wait: 1300, select: 'chief' },
	{ wait: 800, bot: 'chief', status: 'thinking' },
	{
		wait: 1800,
		bot: 'chief',
		preview: 'need a yes on the venue',
		message: {
			from: 'bot',
			text: 'Catering locked the 16th. The hold expires Friday. I still need a yes on the venue.',
		},
	},
	{ wait: 500, bot: 'chief', status: 'idle' },
	{ wait: 1400, select: 'new-agent' },
];

export const USER = {
	name: 'You',
	initials: 'YO',
};

export function replyFor(botName: string): string {
	return `Noted. I will stay on this and come back if ${botName} needs a decision.`;
}

export function formatTime(date: Date): string {
	return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
