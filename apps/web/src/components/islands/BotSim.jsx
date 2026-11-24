import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Mic, Monitor, Plus, Search, Send } from 'lucide-react';
import { BOTS, DEFAULT_THEME, PLAYLIST, USER, formatTime, replyFor } from '~/data/botsim';

function cloneBots() {
	return BOTS.map((bot) => ({
		...bot,
		messages: bot.messages.map((message) => ({ ...message })),
	}));
}

function nextId(prefix) {
	return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function Avatar({ bot, size = 'md' }) {
	const dim = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
	if (bot.shape === 'triangle') {
		return (
			<span className={`relative inline-flex ${dim} items-center justify-center`} aria-hidden="true">
				<svg viewBox="0 0 32 32" className="h-full w-full">
					<path d="M16 3.5 L30 27.5 H2 Z" fill={bot.color} />
				</svg>
			</span>
		);
	}
	if (bot.shape === 'group') {
		return (
			<span className={`relative inline-block ${dim}`} aria-hidden="true">
				<span
					className="absolute left-0 top-1 h-[1.15rem] w-[1.15rem] rounded-full"
					style={{ background: bot.color }}
				/>
				<span
					className="absolute right-0 top-1 h-[1.15rem] w-[1.15rem] rounded-full"
					style={{ background: bot.color2 || bot.color }}
				/>
			</span>
		);
	}
	return (
		<span
			className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full`}
			style={{ background: bot.color }}
			aria-hidden="true"
		/>
	);
}

function StatusDots() {
	return (
		<span className="bot-sim-dots" aria-hidden="true">
			<span />
			<span />
			<span />
		</span>
	);
}

function statusLabel(status) {
	if (status === 'thinking') return 'Thinking';
	if (status === 'typing') return 'Typing';
	if (status === 'working') return 'Working';
	return '';
}

function previewFor(bot) {
	const live = statusLabel(bot.status);
	if (live && (bot.status === 'thinking' || bot.status === 'typing')) {
		return `${live}...`;
	}
	return bot.preview;
}

const PALETTE_VARS = {
	background: 'bg',
	youBubble: 'you-bg',
	youText: 'you-fg',
	botBubble: 'bot-bg',
	botText: 'bot-fg',
};

/**
 * The agent's theme as inline custom properties (--bot-sim-light-bg and so
 * on), with DEFAULT_THEME for a mode the theme leaves out. The .bot-sim-*
 * rules in components.css read them and pick the light or dark set.
 */
function themeStyle(theme) {
	const style = {};
	for (const mode of ['light', 'dark']) {
		const palette = theme?.[mode] ?? DEFAULT_THEME[mode];
		for (const [key, name] of Object.entries(PALETTE_VARS)) {
			if (palette[key]) style[`--bot-sim-${mode}-${name}`] = palette[key];
		}
	}
	return style;
}

function messageClass(from, theme) {
	const pill = Boolean(theme?.pillBubbles);
	if (from === 'you') return `bot-sim-you px-4 py-2.5 ${pill ? 'rounded-3xl' : 'rounded-lg'}`;
	const bubble = pill ? 'bot-sim-bot bot-sim-bot-bubble rounded-3xl px-4 py-2.5' : 'bot-sim-bot';
	return theme?.serifReplies ? `${bubble} font-serif` : bubble;
}

export default function BotSim() {
	const [bots, setBots] = useState(cloneBots);
	const [selectedId, setSelectedId] = useState('new-agent');
	const [query, setQuery] = useState('');
	const [draft, setDraft] = useState('');
	const threadRef = useRef(null);
	const pauseUntilRef = useRef(0);
	const stepRef = useRef(0);
	const timerRef = useRef(0);

	useEffect(() => {
		const node = threadRef.current;
		if (node) node.scrollTop = node.scrollHeight;
	}, [bots, selectedId]);

	useEffect(() => {
		let cancelled = false;

		const applyEvent = (event) => {
			if (event.select) {
				if (Date.now() < pauseUntilRef.current) return;
				setSelectedId(event.select);
				return;
			}

			setBots((current) =>
				current.map((bot) => {
					if (bot.id !== event.bot) return bot;
					const next = { ...bot };
					if (event.status) next.status = event.status;
					if (event.preview) next.preview = event.preview;
					if (event.time) next.time = event.time;
					if (event.message) {
						next.messages = [
							...bot.messages,
							{ ...event.message, id: nextId(bot.id) },
						];
						next.time = formatTime(new Date());
						next.status = event.message.from === 'bot' ? 'idle' : bot.status;
					}
					return next;
				}),
			);
		};

		const tick = () => {
			if (cancelled) return;
			const event = PLAYLIST[stepRef.current % PLAYLIST.length];
			if (stepRef.current > 0 && stepRef.current % PLAYLIST.length === 0) {
				setBots(cloneBots());
				if (Date.now() >= pauseUntilRef.current) {
					setSelectedId('new-agent');
				}
			}
			applyEvent(event);
			stepRef.current += 1;
			const next = PLAYLIST[stepRef.current % PLAYLIST.length];
			timerRef.current = window.setTimeout(tick, next.wait);
		};

		timerRef.current = window.setTimeout(tick, PLAYLIST[0].wait);
		return () => {
			cancelled = true;
			window.clearTimeout(timerRef.current);
		};
	}, []);

	const selected = bots.find((bot) => bot.id === selectedId) ?? bots[0];
	const visibleBots = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return bots;
		return bots.filter(
			(bot) => bot.name.toLowerCase().includes(q) || bot.job.toLowerCase().includes(q),
		);
	}, [bots, query]);

	const holdSelection = (id) => {
		setSelectedId(id);
		pauseUntilRef.current = Date.now() + 20000;
	};

	const sendDraft = (event) => {
		event.preventDefault();
		const text = draft.trim();
		if (!text || !selected) return;
		const botId = selected.id;
		const botName = selected.name;
		setDraft('');
		holdSelection(botId);
		setBots((current) =>
			current.map((bot) =>
				bot.id === botId
					? {
							...bot,
							status: 'thinking',
							preview: 'Thinking...',
							time: formatTime(new Date()),
							messages: [
								...bot.messages,
								{ id: nextId('you'), from: 'you', text },
							],
						}
					: bot,
			),
		);
		window.setTimeout(() => {
			setBots((current) =>
				current.map((bot) =>
					bot.id === botId
						? {
								...bot,
								status: 'typing',
								preview: 'Typing...',
							}
						: bot,
				),
			);
		}, 700);
		window.setTimeout(() => {
			const reply = replyFor(botName);
			setBots((current) =>
				current.map((bot) =>
					bot.id === botId
						? {
								...bot,
								status: 'idle',
								preview: reply,
								time: formatTime(new Date()),
								messages: [
									...bot.messages,
									{ id: nextId(botId), from: 'bot', text: reply },
								],
							}
						: bot,
				),
			);
		}, 1700);
	};

	const live = statusLabel(selected.status);
	const pill = Boolean(selected.theme?.pillBubbles);

	return (
		<div className="bot-sim not-prose">
			<div
				style={themeStyle(selected.theme)}
				className="bot-sim-window overflow-hidden rounded-[28px] border border-foreground/10 shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
				<div className="grid min-h-[640px] lg:grid-cols-[300px_1fr]">
					<aside className="flex flex-col border-b border-foreground/10 lg:border-b-0 lg:border-r">
						<div className="flex items-center gap-3 px-4 py-3">
							<div className="flex items-center gap-1.5" aria-hidden="true">
								<span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
								<span className="h-3 w-3 rounded-full bg-[#febc2e]" />
								<span className="h-3 w-3 rounded-full bg-[#28c840]" />
							</div>
							<button
								type="button"
								className="ml-auto inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
								aria-label="Start a new agent"
								onClick={() => holdSelection('new-agent')}
							>
								<Plus className="h-4 w-4" />
							</button>
						</div>
						<div className="px-3 pb-3">
							<label className="sr-only" htmlFor="bot-sim-search">
								Search agents
							</label>
							<div className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm text-muted-foreground">
								<Search className="h-4 w-4 shrink-0" />
								<input
									id="bot-sim-search"
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder="Search"
									className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
								/>
							</div>
						</div>
						<ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-2" aria-label="Agents">
							{visibleBots.map((bot) => {
								const on = bot.id === selected.id;
								return (
									<li key={bot.id}>
										<button
											type="button"
											onClick={() => holdSelection(bot.id)}
											className={`flex w-full cursor-pointer items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
												on ? 'bg-foreground/5' : 'hover:bg-foreground/5'
											}`}
										>
											<Avatar bot={bot} />
											<span className="min-w-0 flex-1">
												<span className="flex items-baseline justify-between gap-2">
													<span className="truncate text-sm font-medium">{bot.name}</span>
													<span className="shrink-0 text-[11px] text-muted-foreground">
														{bot.time}
													</span>
												</span>
												<span className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-muted-foreground">
													{(bot.status === 'thinking' || bot.status === 'typing') && (
														<StatusDots />
													)}
													<span className="truncate">{previewFor(bot)}</span>
												</span>
											</span>
										</button>
									</li>
								);
							})}
							{visibleBots.length === 0 && (
								<li className="px-3 py-6 text-sm text-muted-foreground">No agents match that search.</li>
							)}
						</ul>
						<div className="flex items-center gap-3 border-t border-foreground/10 px-4 py-3">
							<span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
								{USER.initials}
							</span>
							<span className="text-sm font-medium">{USER.name}</span>
						</div>
					</aside>

					<section className="flex min-h-[520px] flex-col" aria-label={`${selected.name} conversation`}>
						<header className="flex items-center gap-3 border-b border-foreground/10 px-5 py-3">
							<Avatar bot={selected} />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{selected.name}</p>
								<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
									{live ? (
										<>
											<StatusDots />
											<span>{live}...</span>
										</>
									) : (
										<span>{selected.job}</span>
									)}
								</p>
							</div>
							<span
								className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground"
								title="Shared computer"
								aria-hidden="true"
							>
								<Monitor className="h-4 w-4" />
							</span>
						</header>

						<div ref={threadRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-5">
							<AnimatePresence initial={false}>
								{selected.messages.map((message) => (
									<motion.div
										key={message.id}
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.22 }}
										className={`flex ${message.from === 'you' ? 'justify-end' : 'justify-start'}`}
									>
										{message.from === 'tool' ? (
											<p className="rounded-full border border-foreground/10 bg-muted px-3 py-1 text-xs text-muted-foreground">
												{message.text}
											</p>
										) : (
											<div
												className={`max-w-[85%] text-sm leading-relaxed ${messageClass(message.from, selected.theme)}`}
											>
												{message.text}
											</div>
										)}
									</motion.div>
								))}
							</AnimatePresence>
							{(selected.status === 'thinking' ||
								selected.status === 'typing' ||
								selected.status === 'working') && (
								<div className="flex justify-start">
									<div
										className={`text-sm text-muted-foreground ${
											pill ? 'bot-sim-bot-bubble rounded-3xl px-4 py-2.5' : 'py-1'
										}`}
									>
										<StatusDots />
										<span className="sr-only">{live}</span>
									</div>
								</div>
							)}
						</div>

						<form onSubmit={sendDraft} className="px-4 pb-4 pt-1">
							<div className="flex items-center gap-2 rounded-full border border-foreground/10 bg-background px-2 py-1.5 shadow-sm">
								<button
									type="button"
									className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5"
									aria-label="Attachments are not in this proof of concept"
									title="Attachments are not in this proof of concept"
								>
									<Plus className="h-4 w-4" />
								</button>
								<label className="sr-only" htmlFor="bot-sim-composer">
									Message {selected.name}
								</label>
								<input
									id="bot-sim-composer"
									value={draft}
									onChange={(event) => setDraft(event.target.value)}
									placeholder={`Message ${selected.name}`}
									className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
								/>
								{draft.trim() ? (
									<button
										type="submit"
										className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-foreground text-background"
										aria-label={`Send message to ${selected.name}`}
									>
										<Send className="h-4 w-4" />
									</button>
								) : (
									<button
										type="button"
										className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-foreground text-background"
										aria-label="Voice is not in this proof of concept"
										title="Voice is not in this proof of concept"
									>
										<Mic className="h-4 w-4" />
									</button>
								)}
							</div>
						</form>
					</section>
				</div>
			</div>
		</div>
	);
}
