/**
 * This repository, named once.
 *
 * The site links into its own source from four places: the blueprint source
 * file, the skills install command, the "Review skill details on GitHub" link,
 * and the install command the remark plugin injects into skill READMEs. All
 * four hardcoded the owner/repo, so renaming the repository to
 * `semantius-site` broke every one of them into a 404 and each had to be
 * hunted down separately.
 *
 * Import these instead of writing a github.com URL. Note that the CLI lives in
 * its own repository (`semantius/semantius-cli`) and is not covered here.
 */
export const GITHUB_REPO = 'semantius/semantius-site';

/** A directory in this repo on the default branch. */
export const githubTreeUrl = (path: string): string =>
	`https://github.com/${GITHUB_REPO}/tree/main/${path}`;

/** A single file in this repo on the default branch. */
export const githubBlobUrl = (path: string): string =>
	`https://github.com/${GITHUB_REPO}/blob/main/${path}`;

/** Where a skill's source lives. This is also what `npx skills add` takes. */
export const skillSourceUrl = (skillName: string): string => githubTreeUrl(`skills/${skillName}`);
