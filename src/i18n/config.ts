export const LOCALES = ['en-US', 'zh-Hans-CN', 'ja-JP'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en-US'

/** Fallback chain: try requested → en-US → zh-Hans-CN → ja-JP */
export function getFallbackChain(locale: Locale): Locale[] {
	const chain: Locale[] = [locale]
	for (const l of LOCALES) {
		if (!chain.includes(l)) chain.push(l)
	}
	return chain
}

export function isValidLocale(value: string): value is Locale {
	return LOCALES.includes(value as Locale)
}

/** BCP 47 tags for html lang attribute and hreflang */
export const BCP47: Record<Locale, string> = {
	'en-US': 'en-US',
	'zh-Hans-CN': 'zh-Hans-CN',
	'ja-JP': 'ja-JP'
}

/** Locale labels for the language switcher */
export const LOCALE_LABELS: Record<Locale, string> = {
	'en-US': 'English',
	'zh-Hans-CN': '中文',
	'ja-JP': '日本語'
}
