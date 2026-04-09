// @ts-check

import { fileURLToPath } from 'node:url'
import cloudflare from '@astrojs/cloudflare'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import icon from 'astro-icon'
import { defineConfig } from 'astro/config'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

// https://astro.build/config
export default defineConfig({
	adapter: cloudflare({
		imageService: { build: 'compile', runtime: 'cloudflare-binding' },
		sessionKVBindingName: 'ding-ee-kv'
	}),
	site: 'https://ding.ee',
	prefetch: true,
	image: {
		responsiveStyles: true,
		objectFit: 'fill',
		layout: 'constrained'
	},
	i18n: {
		defaultLocale: 'en-US',
		locales: ['en-US', 'zh-Hans-CN', 'ja-JP'],
		routing: {
			prefixDefaultLocale: true,
			redirectToDefaultLocale: false
		}
	},
	integrations: [mdx(), react(), sitemap(), icon()],
	markdown: {
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex]
	},
	vite: {
		optimizeDeps: {
			exclude: ['astro-icon', 'astro-icon/components']
		},
		ssr: {
			optimizeDeps: {
				exclude: ['astro-icon', 'astro-icon/components']
			}
		},
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url))
			}
		},
		plugins: [tailwindcss()]
	}
})
