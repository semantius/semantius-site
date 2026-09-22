
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '../site.config';
// Derive post URLs from the shared route helpers, never inline. This file used
// `post.slug`, which the Astro content layer stopped providing, so every item
// in the live feed linked to /blog/undefined.
import { blogPath, changelogAnchor } from '../lib/routes';

export async function GET(context) {
	const blog = await getCollection('blog');
	const changelog = await getCollection('changelog');

	const items = [
		...blog.map((post) => ({
			title: post.data.title,
			pubDate: post.data.pubDate,
			description: post.data.description,
			link: `${blogPath(post)}/`,
		})),
		...changelog.map((entry) => ({
			title: `${entry.data.version} - ${entry.data.title}`,
			pubDate: entry.data.pubDate,
			description: entry.data.description,
			link: changelogAnchor(entry),
		})),
	].sort((a, b) => new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf());

	return rss({
		title: siteConfig.name,
		description: siteConfig.description,
		site: context.site,
		items: items,
		customData: `<language>en-us</language>`,
		trailingSlash: false,
	});
}
