import rss from '@astrojs/rss'
import { getSiteDescription, getSiteTitle } from '../../consts'
import { LOCALES } from '../../i18n/config'
import { getLocalizedPosts, getSlug } from '../../lib/content'

export function getStaticPaths() {
	return LOCALES.map(lang => ({ params: { lang } }))
}

export async function GET(context) {
	const lang = context.params.lang
	const posts = await getLocalizedPosts(lang)
	return rss({
		title: getSiteTitle(lang),
		description: getSiteDescription(lang),
		site: context.site,
		items: posts.map(post => ({
			...post.data,
			link: `/${lang}/${getSlug(post.id)}/`
		}))
	})
}
