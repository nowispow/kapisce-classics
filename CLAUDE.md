# CLAUDE.md — Kapisce Classics

Project conventions and reference for Claude Code sessions.

---

## Project overview

Annotated, illustrated public domain classics for educators and book-club
leaders. Built with Astro 6 (SSG), Tailwind v4, shadcn/ui (React), and
Svelte islands. See PRD.md for the full phase checklist.

---

## Content collections

| Collection | Path | Purpose |
|---|---|---|
| `blog` | `src/content/blog/` | Editorial blog posts (MDX) |
| `chapters` | `src/content/chapters/` | Novel chapters (plain + enhanced, MDX) |
| `novels` | `src/content/novels/` | Novel metadata entries |
| `authors` | `src/content/authors/` | Author profiles |
| `projects` | `src/content/projects/` | About-page project cards |

### Adding a new collection

1. Define in `src/content.config.ts` → `export const collections`.
2. Export a type alias: `export type NewEntry = CollectionEntry<'new_collection'>`.
3. Add to `AnyCollectionEntry` and `ArticleEntry` unions in `src/lib/data-utils.ts`.
4. Use type guards or `(entry.data as any)` if schema diverges from `ArticleEntry`.

---

## Chapter naming convention

```
src/content/chapters/{novel-slug}-ch-{n}.mdx          # plain
src/content/chapters/{novel-slug}-ch-{n}-enhanced.mdx  # enhanced (paid)
src/content/chapters/{locale}/{filename}.mdx            # translation
```

Enhanced chapters are detected by the `-enhanced` suffix in the entry ID.
Locale translations live in subdirectories named by BCP 47 tag (e.g. `fr`, `es`).

---

## Content pipeline (adding a new novel)

1. Source plain text from Project Gutenberg.
2. Convert via Pandoc to MDX: `pandoc input.txt -o output.mdx`.
3. Split into chapter files following the naming convention above.
4. Add frontmatter: `title`, `description`, `date`, `authors`, `novel` (ref to novel slug), `chapter_number`, `tags`.
5. Generate enhanced version with `Callout` annotation components.
6. Generate translations for target locales → locale subdirectory.
7. Generate illustrations → `public/static/illustrations/{novel}/ch-{n}/`.
8. Add / update the novel entry in `src/content/novels/`.

---

## Key components

| Component | File | Notes |
|---|---|---|
| SpeedReader | `src/components/SpeedReader.svelte` | RSVP reader; hydrates `client:load` on chapter/blog pages |
| Callout | `src/components/Callout.astro` | Enhanced-chapter annotation blocks |
| IllustratedFigure | `src/components/IllustratedFigure.astro` | AI-generated scene illustrations |
| Footer | `src/components/Footer.astro` | Links SOCIAL_LINKS + legal nav |

---

## Environment variables

See `.env.example` for all variables with descriptions. Copy to `.env` for local dev.

---

## Coding conventions

- No comments unless the *why* is non-obvious.
- Prefer editing existing files; don't create new abstractions speculatively.
- Astro pages use the `Layout` wrapper from `src/layouts/Layout.astro`.
- Icons via `astro-icon` with the `lucide:` prefix (e.g. `lucide:book-open`).
- Tailwind v4 utility classes only — no arbitrary CSS files.
- Svelte islands for interactivity; React for shadcn/ui components.

---

## MCP integrations

TODO — to be configured in Phase 4:

- **Gitea MCP** — issue/PR management, deploy tags
- **Dokploy MCP** — service health, redeployments, log access
- **Listmonk API** — subscriber growth, campaign scheduling
- **PostHog API** — engagement dashboards, funnel reports

Update this section with connection details, tokens, and available operations once each is set up.
