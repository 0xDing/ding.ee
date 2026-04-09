import type { Locale } from './i18n/config'
import { t } from './i18n/utils'

export function getSiteTitle(locale: Locale): string {
	return t(locale, 'site.title')
}

export function getSiteDescription(locale: Locale): string {
	return t(locale, 'site.description')
}
