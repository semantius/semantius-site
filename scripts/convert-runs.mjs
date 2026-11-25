/**
 * pnpm convertruns: turns exported agent runs into /botsim chats.
 *
 * runs/botmap.json maps a chat file to a run, both named without .json:
 *
 *   { "grok-bot": "lms" }
 *
 * reads runs/lms.json and writes apps/web/src/content/botsim/grok-bot.yaml
 * (see chat-yaml.mjs for the format: long texts are split over several lines),
 * but only when that file does not exist yet: an existing chat is skipped and
 * left as it is, so a generated chat can be edited by hand. To regenerate a
 * chat from its run, delete the chat file first. Chats not in the map are left
 * as they are.
 *
 * A run is an exported transcript: a list of entries, each with a role and a
 * list of parts (text, or a tool call). What becomes a chat line:
 *
 * - Entries that are not displayed (display other than "visible", such as the
 *   system's dispatch notes) are left out.
 * - A user entry becomes one "you" message.
 * - An agent turn becomes one tool section and one reply. The reply is the
 *   turn's longest text, because its last text is often an internal note such
 *   as "Need to call finish_response.". The progress lines in between are left
 *   out.
 * - The tool section is a "tool" message with `calls`: every call of the turn,
 *   each as its tool name and a label (its description, the skill it
 *   activates, or the name of the file it writes). Calls with none of these
 *   (wait_for_user, finish_response) are left out, and commands and outputs
 *   never appear. The section's text is the agent's last progress line before
 *   its last call. BotSim shows it as "Ran 9 tool calls", expandable to the
 *   list.
 * - Text is copied as transcribed, markdown and dashes included. BotSim
 *   renders the agent's replies as markdown.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { chatToYaml } from './chat-yaml.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const runsDir = join(root, 'runs');
const chatsDir = 'apps/web/src/content/botsim';

function readJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function userMessage(parts) {
	const text = parts
		.filter((part) => part.type === 'text')
		.map((part) => part.text)
		.join('\n\n');
	return { from: 'you', text };
}

function callLabel(input = {}) {
	if (input.description) return input.description;
	if (input.name) return input.name;
	if (input.path) return input.path.split('/').pop();
	return null;
}

function agentTurn(parts) {
	// The first of several equally long texts wins.
	let reply = null;
	for (const part of parts) {
		if (part.type === 'text' && (!reply || part.text.length > reply.text.length)) reply = part;
	}

	const calls = [];
	let lastText = '';
	let summary = '';
	for (const part of parts) {
		if (part.type === 'text') {
			lastText = part.text;
			continue;
		}
		const label = callLabel(part.input);
		if (!label) continue;
		calls.push({ tool: part.toolName, text: label });
		summary = lastText;
	}

	const messages = [];
	if (calls.length > 0) messages.push({ from: 'tool', text: summary, calls });
	if (reply) messages.push({ from: 'bot', text: reply.text });
	return messages;
}

const botmap = readJson(join(runsDir, 'botmap.json'));

for (const [chat, run] of Object.entries(botmap)) {
	const target = `${chatsDir}/${chat}.yaml`;
	if (existsSync(join(root, target))) {
		console.log(`${target} exists, skipped`);
		continue;
	}
	const messages = [];
	for (const entry of readJson(join(runsDir, `${run}.json`))) {
		if (entry.display !== 'visible') continue;
		if (entry.role === 'user') messages.push(userMessage(entry.parts));
		else if (entry.role === 'assistant') messages.push(...agentTurn(entry.parts));
	}
	writeFileSync(join(root, target), chatToYaml(messages));
	console.log(`runs/${run}.json -> ${target}: ${messages.length} messages`);
}
