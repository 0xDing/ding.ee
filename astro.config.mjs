// @ts-check

import { fileURLToPath } from 'node:url'
import cloudflare from '@astrojs/cloudflare'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	adapter: cloudflare({
		imageService: { build: 'compile', runtime: 'cloudflare-binding' }
	}),
	site: 'https://ding.ee',
	prefetch: true,
	i18n: {
		defaultLocale: 'en-US',
		locales: ['en-US', 'zh-Hans-CN', 'ja-JP'],
		routing: {
			prefixDefaultLocale: true,
			redirectToDefaultLocale: false
		}
	},
	integrations: [mdx(), react(), sitemap()],
	vite: {
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url))
			}
		},
		plugins: [tailwindcss()]
	}
})
