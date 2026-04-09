import { type CollectionEntry, getCollection, render } from 'astro:content'
import { getFallbackChain, LOCALES, type Locale } from '../i18n/config'

type BlogEntry = CollectionEntry<'blog'>
export interface LocalizedTagGroup {
	label: string
	slug: string
	posts: BlogEntry[]
}

/** Map from lowercase content ID suffix to Locale (Astro lowercases IDs) */
const LANG_MAP = new Map<string, Locale>(LOCALES.map(l => [l.toLowerCase(), l]))

/** Extract slug (folder name) from content id like "first-post/en-us" */
export function getSlug(id: string): string {
	const parts = id.split('/')
	return parts.slice(0, -1).join('/')
}

/** Extract lang from content id like "first-post/en-us" */
export function getLang(id: string): Locale | undefined {
	const parts = id.split('/')
	return LANG_MAP.get(parts[parts.length - 1])
}

/** Build a stable tag slug that still works with non-Latin text */
export function getTagSlug(tag: string): string {
	return tag
		.normalize('NFKC')
		.trim()
		.toLowerCase()
		.replace(/[^\p{Letter}\p{Number}]+/gu, '-')
		.replace(/^-+|-+$/g, '')
}

/** Rough reading time from source text, balancing Latin words and CJK characters */
export function estimateReadingTime(text: string): number {
	// Extract code blocks before stripping them (readers scan code at ~50 WPM)
	const codeBlocks = text.match(/```[\s\S]*?```/g) ?? []
	const codeWords =
		codeBlocks
			.join(' ')
			.replace(/```\w*/g, '')
			.match(/\S+/g)?.length ?? 0

	const normalized = text
		.replace(/^---[\s\S]*?---/m, ' ') // frontmatter
		.replace(/```[\s\S]*?```/g, ' ') // code blocks (counted separately)
		.replace(/`[^`]*`/g, ' ') // inline code
		.replace(/<[^>]+>/g, ' ') // HTML
		.replace(/!\[[^\]]*]\([^)]*\)/g, ' ') // images
		.replace(/\[([^\]]+)]\([^)]*\)/g, '$1') // links → text

	// CJK: ~350 chars/min for non-fiction (IReST cross-language study)
	const cjkChars = normalized.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu)?.length ?? 0

	// Latin: Brysbaert 2019 meta-analysis — 238 WPM for non-fiction
	const latinWords =
		normalized
			.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu, ' ')
			.match(/[\p{Letter}\p{Number}][\p{Letter}\p{Number}''-]*/gu)?.length ?? 0

	// Count images (~12s each per Nielsen/Norman eye-tracking research)
	const imageCount = (text.match(/!\[[^\]]*]\([^)]*\)/g) ?? []).length

	const minutes =
		latinWords / 238 + // Brysbaert non-fiction baseline
		cjkChars / 350 + // IReST CJK chars/min (conservative)
		codeWords / 50 + // code scanned much slower
		(imageCount * 15) / 60 // ~15s per image

	return Math.max(1, Math.ceil(minutes))
}

type ProjectEntry = CollectionEntry<'projects'>

/** Get all localized projects for a locale, sorted by order then title */
export async function getLocalizedProjects(locale: Locale): Promise<ProjectEntry[]> {
	const all = await getCollection('projects')
	const map = new Map<string, Map<Locale, ProjectEntry>>()

	for (const entry of all) {
		const slug = getSlug(entry.id)
		const lang = getLang(entry.id)
		if (!lang) continue
		if (!map.has(slug)) map.set(slug, new Map())
		map.get(slug)!.set(lang, entry)
	}

	const result: ProjectEntry[] = []
	for (const [, langMap] of map) {
		for (const lang of getFallbackChain(locale)) {
			const entry = langMap.get(lang)
			if (entry) {
				result.push(entry)
				break
			}
		}
	}

	return result.sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title))
}

/** Get all blog posts */
async function allPosts(): Promise<BlogEntry[]> {
	return getCollection('blog')
}

/** Build a map: slug → Map<lang, entry> */
async function buildPostMap(): Promise<Map<string, Map<Locale, BlogEntry>>> {
	const posts = await allPosts()
	const map = new Map<string, Map<Locale, BlogEntry>>()

	for (const post of posts) {
		const slug = getSlug(post.id)
		const lang = getLang(post.id)
		if (!lang) continue
		if (!map.has(slug)) map.set(slug, new Map())
		map.get(slug)!.set(lang, post)
	}

	return map
}

/** Get a single post by slug with fallback chain */
export async function getLocalizedPost(slug: string, locale: Locale): Promise<BlogEntry | undefined> {
	const map = await buildPostMap()
	const langMap = map.get(slug)
	if (!langMap) return undefined

	for (const lang of getFallbackChain(locale)) {
		const post = langMap.get(lang)
		if (post) return post
	}
	return undefined
}

/** Get all posts for a locale (with fallback), sorted by date desc */
export async function getLocalizedPosts(locale: Locale): Promise<BlogEntry[]> {
	const map = await buildPostMap()
	const result: BlogEntry[] = []

	for (const [, langMap] of map) {
		for (const lang of getFallbackChain(locale)) {
			const post = langMap.get(lang)
			if (post) {
				result.push(post)
				break
			}
		}
	}

	return result.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
}

/** Get all tag groups for a locale (with fallback), sorted alphabetically */
export async function getLocalizedTagGroups(locale: Locale): Promise<LocalizedTagGroup[]> {
	const posts = await getLocalizedPosts(locale)
	const groups = new Map<string, LocalizedTagGroup>()

	for (const post of posts) {
		for (const rawTag of post.data.tags) {
			const label = rawTag.trim()
			const slug = getTagSlug(label)
			if (!label || !slug) continue

			if (!groups.has(slug)) {
				groups.set(slug, { label, slug, posts: [] })
			}

			groups.get(slug)!.posts.push(post)
		}
	}

	return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label))
}

/** Get posts for a specific tag slug in a locale */
export async function getLocalizedPostsByTag(locale: Locale, tagSlug: string): Promise<LocalizedTagGroup | undefined> {
	const groups = await getLocalizedTagGroups(locale)
	return groups.find(group => group.slug === tagSlug)
}

/** Get all unique tag slugs across every locale */
export async function getAllTagSlugs(): Promise<string[]> {
	const posts = await allPosts()
	const slugs = new Set<string>()

	for (const post of posts) {
		for (const tag of post.data.tags) {
			const slug = getTagSlug(tag)
			if (slug) slugs.add(slug)
		}
	}

	return [...slugs].sort()
}

/** Get all unique slugs across all languages */
export async function getAllSlugs(): Promise<string[]> {
	const map = await buildPostMap()
	return [...map.keys()]
}

/** Get available languages for a given slug */
export async function getAvailableLocales(slug: string): Promise<Locale[]> {
	const map = await buildPostMap()
	const langMap = map.get(slug)
	if (!langMap) return []
	return LOCALES.filter(l => langMap.has(l))
}

/** Find the locale of the original post for a given slug */
export async function getOriginalLocale(slug: string): Promise<Locale | undefined> {
	const map = await buildPostMap()
	const langMap = map.get(slug)
	if (!langMap) return undefined

	for (const [lang, entry] of langMap) {
		if (entry.data.original) return lang
	}
	return undefined
}

/** Render a post */
export async function renderPost(post: BlogEntry) {
	return render(post)
}
