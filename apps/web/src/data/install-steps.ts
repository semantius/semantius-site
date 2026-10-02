/**
 * The two install steps (founder's v1 spec, §4.5), shown on every sample-prompt
 * page and listed in llms.txt.
 *
 * The skill command is the spec's, which differs from the one the docs build in
 * `lib/skill-install.ts`. That conflict is open: home-tbd.md, C12.
 */
export const INSTALL_CLI =
	'curl -fsSL https://raw.githubusercontent.com/semantius/semantius-cli/main/install.sh | bash';

export const INSTALL_SKILL = 'npx skill install https://github.com/semantius/semantius-cli';

export const OPENCLAW_NOTE = 'OpenClaw installs the same skills with its own installer.';
