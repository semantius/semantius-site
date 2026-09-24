/**
 * What a <RepoCard> says, defined once.
 *
 * Two renderers need these strings and neither can call the other:
 *
 *   - `components/common/RepoCard.astro` prints them on the page
 *   - `lib/dualmark/source.ts` writes them into the markdown twin, because a
 *     twin cannot run an Astro component
 *
 * Import this from both. Never re-derive the URL in a renderer: that is how
 * the skills install command drifted between page and twin (see
 * lib/skill-install.ts).
 */

/** `owner/name` to the repository's GitHub URL. */
export function repoUrl(repo: string): string {
	return `https://github.com/${repo}`;
}
