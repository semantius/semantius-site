/**
 * The skills install command, defined once.
 *
 * Three renderers need this string and none of them can call the others:
 *
 *   - `components/common/SkillInstall.astro` prints it on the page
 *   - its browser script rebuilds it when the agent or global toggle changes
 *   - `lib/dualmark/source.ts` emits it into the markdown twin, because a twin
 *     cannot run an Astro component
 *
 * They each used to compute it, and they drifted: the page rendered
 * `npx skills add semantius/semantius-cli --all --global` while the twin wrote
 * `npx skills add https://github.com/semantius/semantius-cli --global` — a
 * different install, shipped silently to every agent that read the twin instead
 * of the page. Nothing failed, because nothing compared the two.
 *
 * Import this from every renderer. Never re-derive the string.
 */
export interface SkillInstallOptions {
	/** Target agent. "all" is special: it emits --all and never --agent. */
	agent?: string;
	/** Install for every project rather than the current one. */
	global?: boolean;
}

/** The command exactly as the page shows it. Defaults match the default control state. */
export function skillInstallCommand(url: string, options: SkillInstallOptions = {}): string {
	const { agent = 'all', global = true } = options;
	const scope = agent && agent !== 'all' ? ` --agent ${agent}` : ' --all';
	return `npx skills add ${url}${scope}${global ? ' --global' : ''}`;
}
