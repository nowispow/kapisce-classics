## Built on astro-erudite

astro-erudite is an opinionated, unstyled static blogging template built with [Astro](https://astro.build/), [Tailwind](https://tailwindcss.com/), and [shadcn/ui](https://ui.shadcn.com/). Extraordinarily loosely based off the [Astro Micro](https://astro-micro.vercel.app/) theme by [trevortylerlee](https://github.com/trevortylerlee).

## Proof of concept

This project is a proof of concept for combining in-depth, long-form content with web-app style interactivity. The goal is to keep the reading experience content-first while still adding focused interactive components (like the speed reader) where they genuinely improve usability.

## Content licensing (main branch)

All content in the `main` branch (but not other branches) is licensed to end users and developers under the MIT License. See [LICENSE](LICENSE).

## Features

- [Astro](https://astro.build/)'s [Islands](https://docs.astro.build/en/concepts/islands/) architecture for selective hydration and client-side interactivity while maintaining fast static site rendering.
- [shadcn/ui](https://ui.shadcn.com/) with [Tailwind](https://tailwindcss.com/) color conventions for automatic light and dark theme styling. Features accessible, theme-aware UI components for navigation, buttons, and more.
- [Expressive Code](https://expressive-code.com/) for enhanced code block styling, syntax highlighting, and code block titles.
- Blog authoring with [MDX](https://mdxjs.com/) for component-rich content and $\LaTeX$ math rendering via [KaTeX](https://katex.org/).
- Astro [View Transitions](https://docs.astro.build/en/guides/view-transitions/) in <abbr title="Single Page Application">SPA</abbr> mode for smooth route animations.
- SEO optimization with granular metadata and [Open Graph](https://ogp.me/) tag control for each post.
- [RSS](https://en.wikipedia.org/wiki/RSS) feed and sitemap generation.
- Subpost support for breaking long content into digestible parts and organizing related series.
- Author profiles with a dedicated authors page and multi-author post support.
- Project tags with a dedicated tags page for post categorization and discovery.
- Custom Callout component variants for enhanced technical writing.

## Project structure

- `src/pages/`: route definitions and page composition (`blog`, `chapters`, `novels`, etc.).
- `src/content/`: authored source content (blog posts, chapters, authors, novels, projects).
- `src/components/`: reusable UI and interactive components across Astro/Svelte.
- `src/lib/`: data loaders and utility helpers for content and navigation logic.
- `public/`: static assets (favicons, social images, fonts).

## Speed Reader

The Speed Reader is a Svelte island (`src/components/SpeedReader.svelte`) embedded into chapter and blog pages. It parses the rendered content body into word tokens and provides:

- Play/pause and reset controls
- Adjustable WPM presets
- Word-by-word focus display
- Progress tracking through the source text

### Technology stack

This is a list of the various technologies used to build this template:

| Category   | Technology Name                                                                            |
| ---------- | ------------------------------------------------------------------------------------------ |
| Framework  | [Astro](https://astro.build/)                                                              |
| Styling    | [Tailwind](https://tailwindcss.com)                                                        |
| Components | [shadcn/ui](https://ui.shadcn.com/)                                                        |
| Content    | [MDX](https://mdxjs.com/)                                                                  |
| Codeblocks | [Expressive Code](https://expressive-code.com/), [Shiki](https://github.com/shikijs/shiki) |

