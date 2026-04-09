import IntlMessageFormat from 'intl-messageformat'
import type { Locale } from './config'
import { BCP47 } from './config'
import en from './locales/en.json'
import ja from './locales/ja.json'
import zh from './locales/zh.json'

const messages: Record<Locale, Record<string, string>> = { 'en-US': en, 'zh-Hans-CN': zh, 'ja-JP': ja }

const cache = new Map<string, IntlMessageFormat>()

export function t(locale: Locale, key: string, values?: Record<string, unknown>): string {
	const msg = messages[locale]?.[key] ?? messages['en-US'][key] ?? key
	const cacheKey = `${locale}:${key}`

	let fmt = cache.get(cacheKey)
	if (!fmt) {
		fmt = new IntlMessageFormat(msg, BCP47[locale])
		cache.set(cacheKey, fmt)
	}

	return fmt.format(values) as string
}

/** Build a localized path: /{lang}/rest/of/path */
export function localePath(locale: Locale, path: string = ''): string {
	const clean = path.replace(/^\/+/, '')
	return `/${locale}${clean ? `/${clean}` : ''}/`
}
