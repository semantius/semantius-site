/**
 * The skills install command, defined once.
 *
 * Two renderers need this string and neither can call the other:
 *
 *   - `components/common/SkillInstall.astro` prints it on the page
 *   - its browser script rebuilds it when the agent or global toggle changes
 *
 * Import this from both and never re-derive the string: copies of one string
 * drift apart.
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
