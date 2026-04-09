import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.mdx' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			tags: z.array(z.string().min(1)).min(1),
			original: z.boolean().default(true)
		})
})

const about = defineCollection({
	loader: glob({ base: './src/content/about', pattern: '*.mdx' }),
	schema: z.object({})
})

const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.yaml' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			source: z.enum(['github', 'appstore', 'huggingface', 'business']),
			url: z.string(),
			icon: z.optional(image()),
			featured: z.boolean().default(false),
			order: z.number().default(0)
		})
})

export const collections = { blog, about, projects }
