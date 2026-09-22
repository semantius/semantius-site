/**
 * The deploy prompt for a blueprint, defined once.
 *
 * The detail page renders it in a copyable command box; the markdown twin has
 * to write it out, because a twin cannot run the component. When each built the
 * string itself, only the page had it: all 56 twins shipped without the single
 * most actionable line on the page, and nothing noticed until a parity check
 * compared the two.
 *
 * Import from both. Never retype the prompt.
 */
export const blueprintDeployHeading = (systemName: string): string =>
	`Use the ${systemName} semantic blueprint`;

export const blueprintDeployPrompt = (sourceFileUrl: string): string =>
	`/semantius-admin use the architect, analyst and modeler skills to update the semantius platform with the model specified in ${sourceFileUrl}`;
