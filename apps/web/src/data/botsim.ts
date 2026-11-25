/**
 * Roster and chat scripts for the /botsim proof of concept.
 *
 * The layout follows the Grok Bot home page workspace: a sidebar of named
 * agents and a chat for the one in view. The copy is Semantius-flavored so
 * the page is not a brand clone.
 *
 * The sidebar (which agents exist, their order, names and looks) is defined
 * here and does not change while the page runs; only the line under each
 * name does, and BotSim derives it from the chat. Each agent's chat is a script
 * in content/botsim/, in a file named after the agent (Grok Bot is
 * grok-bot.json), so the copy can be edited without touching code. BotSim
 * plays the script, one message at a time, whenever the agent comes into
 * view. Renaming an agent does not rename its file: rename both.
 *
 * A chat can also be generated from an exported agent run with
 * `pnpm convertruns` (scripts/convert-runs.mjs). It only writes chats that
 * do not exist yet, so a generated chat can be edited by hand; delete it to
 * regenerate it from its run.
 */

import claudeDuetMessages from '~/content/botsim/claude-duet.json';
import expenseManagerMessages from '~/content/botsim/expense-manager.json';
import grokBotMessages from '~/content/botsim/grok-bot.json';
import metaMuseMessages from '~/content/botsim/meta-muse.json';
import offsiteCrewMessages from '~/content/botsim/offsite-crew.json';
import openaiDotsMessages from '~/content/botsim/openai-dots.json';
import talentScoutMessages from '~/content/botsim/talent-scout.json';

export type AvatarShape = 'circle' | 'triangle' | 'group';

/** One call in a tool section: the tool's name, when known, and what it did. */
export interface ToolCall {
	/** Missing for a hand-written tool line, which names no tool. */
	tool?: string;
	text: string;
}

export interface ChatMessage {
	id: string;
	from: 'bot' | 'you' | 'tool';
	/** For a tool section, the agent's latest progress line; may be empty. */
	text: string;
	/** A "tool" message shows as one section ("Ran 9 tool calls") that expands to these calls. */
	calls?: ToolCall[];
}

/**
 * Gives an agent's script messages ids from the agent id and their position
 * (chief-1, chief-2, ...), so the JSON files hold only `from`, `text` and,
 * for a tool section, `calls`. A hand-written tool line without `calls`, such
 * as { "from": "tool", "text": "Signed in to the ticket queue" }, becomes a
 * one-call section whose call is that text, so every tool message looks the
 * same. Add "calls": [{ "tool": "browser", "text": "..." }] instead to name
 * the tool. The JSON is not validated: a `from` other than bot, you or tool
 * is not caught.
 */
function seedMessages(
	botId: string,
	messages: ReadonlyArray<{ from: string; text: string; calls?: ReadonlyArray<ToolCall> }>,
): ChatMessage[] {
	return messages.map((message, index) => {
		const id = `${botId}-${index + 1}`;
		const from = message.from as ChatMessage['from'];
		if (from === 'tool' && !message.calls) return { id, from, text: '', calls: [{ text: message.text }] };
		return {
			id,
			from,
			text: message.text,
			...(message.calls ? { calls: message.calls.map((call) => ({ tool: call.tool, text: call.text })) } : {}),
		};
	});
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
	time: string;
	messages: ChatMessage[];
}

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
		time: '3:43 PM',
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
		time: '11:43 PM',
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
		},
		time: '8:43 PM',
		messages: seedMessages('inbox', claudeDuetMessages),
	},
	{
		id: 'account',
		name: 'OpenAI dots',
		job: 'Renewals',
		color: '#000',
		shape: 'circle',
		time: '6:43 PM',
		messages: seedMessages('account', openaiDotsMessages),
	},
	{
		id: 'talent',
		name: 'Talent Scout',
		job: 'Hiring',
		color: '#2563eb',
		shape: 'circle',
		time: '3:43 PM',
		messages: seedMessages('talent', talentScoutMessages),
	},
	{
		id: 'expense',
		name: 'Expense Manager',
		job: 'Expenses',
		color: '#f97316',
		shape: 'circle',
		time: '7:43 PM',
		messages: seedMessages('expense', expenseManagerMessages),
	},
	{
		id: 'offsite',
		name: 'Offsite crew',
		job: 'Group thread',
		color: '#14b8a6',
		color2: '#8b5cf6',
		shape: 'group',
		time: '5:43 PM',
		messages: seedMessages('offsite', offsiteCrewMessages),
	},
];

export const USER = {
	name: 'You',
	initials: 'YO',
};
