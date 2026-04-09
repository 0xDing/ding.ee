# AGENTS Guidelines

This project is a personal website and blog for Boris Ding, built with Astro, React components, and Tailwind CSS.

## Package Manager

- Use `bun` for this repository.
- Prefer `bun run <script>` for project scripts.
- If an ad hoc package binary is needed, prefer `bunx <tool>` over `npx <tool>`.

## Common Commands

- Install dependencies: `bun install`
- Start dev server: `bun run dev`
- Build: `bun run build`
- Preview production build: `bun run preview`

## Quality Checks

- Type check: `bun run type-check`
  - Runs `astro check && tsgo --noEmit --skipLibCheck`
- Lint: `bun run lint`
  - Uses Biome via `biome check .`
- Lint and apply fixes: `bun run lint:fix`
- Format: `bun run fmt`
  - Uses Biome via `biome format --write .`



## User Instructions

- When the user gives explicit, concrete instructions, treat them as hard constraints.
- Do not reinterpret explicit instructions as loose guidance or “reference only”.
- Do not substitute different paths, aliases, libraries, directory layouts, or execution order unless the user explicitly approves it.
- If a user instruction is specific but unclear in implementation details, preserve the stated constraint and verify the missing detail before improvising.
- In most cases, only use existing design tokens and framework scales for typography, spacing, radius, color, shadows, and breakpoints.
- Avoid arbitrary values and “magic numbers” such as `text-[...]`, `tracking-[...]`, `rounded-[...]`, custom one-off CSS variables, or similar ad hoc styling unless existing design tokens truly have no close equivalent for the intended visual result.
- Do not invent new design tokens or CSS variables unless the user explicitly requests it or the existing design system genuinely cannot express the required styling.

---

> Astro is an all-in-one web framework for building websites. 

- Astro uses island architecture and server-first design to reduce client-side JavaScript overhead and ship high performance websites.
- Astro’s friendly content-focused features like content collections and built-in Markdown support make it an excellent choice for blogs, marketing, and e-commerce sites amongst others.
- The `.astro` templating syntax provides powerful server rendering in a format that follows HTML standards and will feel very familiar to anyone who has used JSX.
- Astro supports popular UI frameworks like React, Vue, Svelte, Preact, and Solid through official integrations.
- Astro is powered by Vite, comes with a fast development server, bundles your JavaScript and CSS for you, and makes building websites feel fun.

## Documentation Sets

- [Abridged documentation](https://docs.astro.build/llms-small.txt): a compact version of the documentation for Astro, with non-essential content removed
- [Complete documentation](https://docs.astro.build/llms-full.txt): the full documentation for Astro
- [API Reference](https://docs.astro.build/_llms-txt/api-reference.txt): terse, structured descriptions of Astro’s APIs
- [How-to Recipes](https://docs.astro.build/_llms-txt/how-to-recipes.txt): guided examples of adding features to an Astro project
- [Build a Blog Tutorial](https://docs.astro.build/_llms-txt/build-a-blog-tutorial.txt): a step-by-step guide to building a basic blog with Astro
- [Deployment Guides](https://docs.astro.build/_llms-txt/deployment-guides.txt): recipes for how to deploy an Astro website to different services
- [CMS Guides](https://docs.astro.build/_llms-txt/cms-guides.txt): recipes for how to use different content management systems in an Astro project
- [Backend Services](https://docs.astro.build/_llms-txt/backend-services.txt): advice on how to integrate backend services like Firebase, Sentry, and Supabase in an Astro project
- [Migration Guides](https://docs.astro.build/_llms-txt/migration-guides.txt): advice on how to migrate a project built with another tool to Astro
- [Additional Guides](https://docs.astro.build/_llms-txt/additional-guides.txt): guides to e-commerce, authentication, testing, and digital asset management in Astro projects

## Notes

- The complete documentation includes all content from the official documentation
- The content is automatically generated from the same source as the official documentation

## Optional

- [The Astro blog](https://astro.build/blog/): the latest news about Astro development