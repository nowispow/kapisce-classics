# Kapisce Classics

Annotated, illustrated public domain classics for educators and book-club leaders. Plain text is free; enhanced editions (annotations + AI-generated illustrations) are sold per edition.

**For the full product roadmap and phase checklist — see [PRD.md](PRD.md).**

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Astro 6 (SSG, Content Collections) |
| Styling | Tailwind CSS v4, shadcn/ui (React) |
| Interactive | Svelte islands (SpeedReader, forms) |
| Email | Listmonk + Resend (Phase 1) |
| Analytics | PostHog self-hosted (Phase 1) |
| Payments | Lemon Squeezy (Phase 2) |
| CI/CD | Gitea Actions → Dokploy |

## Project structure

- `src/pages/` — route definitions (`chapters`, `novels`, `authors`, `blog`, legal pages)
- `src/content/` — authored source content (chapters, novels, authors, blog posts)
- `src/components/` — reusable UI components (Astro + Svelte)
- `src/lib/` — data loaders and utility helpers
- `public/` — static assets (favicons, fonts, illustrations)
- `docs/` — internal docs (CI/CD test plan, marketing copy)

## Development

```sh
npm install
npm run dev       # starts at http://localhost:1234
npm run build     # type-check + static build
npm run preview   # preview the built site
```

## Content model

Two reading modes per chapter:

- **Plain** — free, public domain text
- **Enhanced** — paid; adds `Callout` annotations, `IllustratedFigure` scenes, footnotes

See the content pipeline steps in [PRD.md § Phase 3 — Content Pipeline](PRD.md) for how to add new novels and chapters.

## Speed Reader

A Svelte island (`src/components/SpeedReader.svelte`) that parses chapter text into word tokens and provides word-by-word RSVP reading with play/pause, WPM controls, and progress tracking.

## License

Content (text, annotations, illustrations) is licensed under [CC BY-NC 4.0](LICENSE). Site source code is licensed under the MIT License. See [LICENSE](LICENSE) for details.
