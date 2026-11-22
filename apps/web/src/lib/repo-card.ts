/**
 * What a <RepoCard> links to. Used by components/common/RepoCard.astro.
 */

/** `owner/name` to the repository's GitHub URL. */
export function repoUrl(repo: string): string {
	return `https://github.com/${repo}`;
}
