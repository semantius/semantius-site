/**
 * Scripted roster and timeline for the /botsim proof of concept.
 *
 * The layout follows the Grok Bot home page workspace: a sidebar of named
 * agents and a chat for the one in view. The copy is Semantius-flavored so
 * the page is not a brand clone.
 *
 * The sidebar (which agents exist, their order, names and looks) is defined
 * here. Each agent's starting chat is in content/botsim/, in a file named after
 * the agent (Grok Bot is grok-bot.json), so the copy can be edited without
 * touching code. Renaming an agent does not rename its file: rename both.
 */

import claudeDuetMessages from '~/content/botsim/claude-duet.json';
import expenseManagerMessages from '~/content/botsim/expense-manager.json';
import grokBotMessages from '~/content/botsim/grok-bot.json';
import metaMuseMessages from '~/content/botsim/meta-muse.json';
import offsiteCrewMessages from '~/content/botsim/offsite-crew.json';
import openaiDotsMessages from '~/content/botsim/openai-dots.json';
import talentScoutMessages from '~/content/botsim/talent-scout.json';

export type BotStatus = 'idle' | 'thinking' | 'typing' | 'working';
export type AvatarShape = 'circle' | 'triangle' | 'group';

export interface ChatMessage {
	id: string;
	from: 'bot' | 'you' | 'tool';
	text: string;
}

/**
 * Gives an agent's starting messages ids from the agent id and their position
 * (chief-1, chief-2, ...), so the JSON files hold only `from` and `text`.
 * The JSON is not validated: a `from` other than bot, you or tool is not caught.
 */
function seedMessages(botId: string, messages: ReadonlyArray<{ from: string; text: string }>): ChatMessage[] {
	return messages.map((message, index) => ({
		id: `${botId}-${index + 1}`,
		from: message.from as ChatMessage['from'],
		text: message.text,
	}));
}

/** An agent's colors for one color mode. */
export interface BotPalette {
	/** The whole simulator window: sidebar and chat. */
	background: string;
	youBubble: string;
	youText: string;
	/** Only used with botShape: without it the agent's replies have no bubble. */
	botBubble?: string;
	/** A 1px border around the agent's bubble. */
	botBorder?: string;
	botText: string;
}

/** Bubble corners: small and large rounded corners, or fully rounded. */
export type BubbleShape = 'small' | 'large' | 'pill';

/**
 * An agent's own look, applied to the simulator window while that agent is
 * in view. A mode without a palette falls back to DEFAULT_THEME.
 */
export interface BotTheme {
	light?: BotPalette;
	dark?: BotPalette;
	/** Corners of your bubble. Default 'small'. */
	youShape?: BubbleShape;
	/** Puts the agent's replies in a bubble with these corners. Without it they are plain text. */
	botShape?: BubbleShape;
	/** Sets the agent's replies in the system serif font. */
	serifReplies?: boolean;
}

/**
 * The look of every agent without a theme of its own. Sampled from the
 * reference screenshots for the default chat.
 */
export const DEFAULT_THEME = {
	light: {
		background: '#ffffff',
		youBubble: '#f5f5f5',
		youText: '#0a0a0a',
		botText: '#0a0a0a',
	},
	dark: {
		background: '#0a0a0a',
		youBubble: '#262626',
		youText: '#fafafa',
		botText: '#fafafa',
	},
} satisfies Required<Pick<BotTheme, 'light' | 'dark'>>;

export interface BotSeed {
	id: string;
	name: string;
	job: string;
	color: string;
	color2?: string;
	shape: AvatarShape;
	theme?: BotTheme;
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
		name: 'Grok Bot',
		job: 'Coordination',
		color: '#000',
		shape: 'circle',
		// Sampled from Grok Bot screenshots.
		theme: {
			light: {
				background: '#fcfcfc',
				youBubble: '#282828',
				youText: '#ffffff',
				botBubble: '#f0f0f0',
				botBorder: '#e4e4e4',
				botText: '#1c1c1c',
			},
			dark: {
				background: '#121212',
				youBubble: '#3c3c3c',
				youText: '#f5f5f5',
				botBubble: '#1f1f1f',
				botBorder: '#262626',
				botText: '#f5f5f5',
			},
			youShape: 'pill',
			botShape: 'large',
		},
		preview: 'booked the venue and sent the agenda',
		time: '3:43 PM',
		status: 'idle',
		messages: seedMessages('chief', grokBotMessages),
	},
	{
		id: 'new-agent',
		name: 'Meta Muse',
		job: 'Intake',
		color: '#1d65c1',
		shape: 'circle',
		// Light colors are sampled from a Muse screenshot. Dark colors are read by
		// eye from a second screenshot that was not available as a file.
		theme: {
			light: {
				background: '#fcfcfc',
				youBubble: '#b8dbfe',
				youText: '#111112',
				botBubble: '#e9eaeb',
				botText: '#111112',
			},
			dark: {
				background: '#1a1a1a',
				youBubble: '#0b7ae8',
				youText: '#ffffff',
				botBubble: '#222222',
				botText: '#ffffff',
			},
			youShape: 'pill',
			botShape: 'pill',
		},
		preview: 'Typing...',
		time: '11:43 PM',
		status: 'thinking',
		messages: seedMessages('new-agent', metaMuseMessages),
	},
	{
		id: 'inbox',
		name: 'Claude Duet',
		job: 'Support queue',
		color: '#d97757',
		shape: 'triangle',
		// Colors read by eye from Claude screenshots that were not available as files.
		theme: {
			light: {
				background: '#ffffff',
				youBubble: '#f0f0f0',
				youText: '#1a1a1a',
				botText: '#1a1a1a',
			},
			dark: {
				background: '#1f1f1f',
				youBubble: '#2c2c2c',
				youText: '#f0f0f0',
				botText: '#f0f0f0',
			},
			serifReplies: true,
		},
		preview: 'inbox at zero, 5 drafts parked',
		time: '8:43 PM',
		status: 'idle',
		messages: seedMessages('inbox', claudeDuetMessages),
	},
	{
		id: 'account',
		name: 'OpenAI dots',
		job: 'Renewals',
		color: '#000',
		shape: 'circle',
		preview: 'invited Vicky, noted the deal',
		time: '6:43 PM',
		status: 'idle',
		messages: seedMessages('account', openaiDotsMessages),
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
		messages: seedMessages('talent', talentScoutMessages),
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
		messages: seedMessages('expense', expenseManagerMessages),
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
		messages: seedMessages('offsite', offsiteCrewMessages),
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
