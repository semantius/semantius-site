/**
 * The deploy prompt for a blueprint, rendered by the blueprint detail page
 * (pages/blueprints/[slug]/index.astro) in a copyable command box.
 */
export const blueprintDeployHeading = (systemName: string): string =>
	`Use the ${systemName} semantic blueprint`;

export const blueprintDeployPrompt = (sourceFileUrl: string): string =>
	`/semantius-admin use the architect, analyst and modeler skills to update the semantius platform with the model specified in ${sourceFileUrl}`;
