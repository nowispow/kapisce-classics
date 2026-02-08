# PRD: Kapisce Classics - Jane Austen Edition

## 1. Vision & Goals
Transform public domain classics into a "Content-First" digital experience. We are starting with **Jane Austen** to establish the pattern for author attribution and high-quality reader components.

## 2. Architecture (Kapisce-Stack)
- **Framework**: Astro (Content Collections for books).
- **Interactive Layers**: Svelte components for speed reading and immersive features.
- **Cross-Platform**: Capacitor integration for iOS/Android distribution.
- **Backend**: Fastify API for Authentication & Authorization.
- **Monetization**: Lemon Squeezy integration as the Merchant of Record for premium content.
- **Styling**: Tailored for readability and classic aesthetics.
- **Attribution**: First-class support for Author-to-Book relationships.

## 3. Scope: Jane Austen Implementation
### Author Page (`/authors/jane-austen`)
- Biography and attribution.
- Dynamic list of books tied to the author.

### Book Reader Components
We need to design components for a premium reading experience:
- **Typography**: Focus on serif fonts optimized for long-form reading.
- **Navigation**: Chapter-by-chapter routing.
- **Progress Tracking**: (Future) Svelte integration for reading state.
- **Speed Reading (Svelte Widget)**:
    - **WPM Selector**: Options for 150, 300, 600, and 900 Words Per Minute.
    - **RSVP Display**: Rapid Serial Visual Presentation mode showing one word at a time.
    - **Controls**: Play/Pause and Reset functionality.
- **Immersive Elements**: Heavy utilization of illustrations and annotations for a deep, rich reading experience.

## 4. User Navigation Flow
1. **Author Hub**: `/authors/jane-austen` (Bio + List of Novels).
2. **Novel Landing**: `/novels/pride-and-prejudice` (Table of Contents / Chapters).
3. **Reader View**: `/blog/pride-and-prejudice-chapter-1` (SEO-optimized post with immersive/speed-read toggles).

## 5. Content Pipeline (ETL)
We will utilize Python scripts (run via `pixi` in `Documents`) to transform raw HTML/MD classics:
1. **Scrape**: Fetch from Project Gutenberg or similar.
2. **Translate**: Convert HTML to clean Markdown.
3. **Fragment**: Split large book files into chapter-sized blocks.
4. **SEO Optimization**: Transform chapters into the standard `src/content/blog/` collection to leverage the theme's SEO and layout features.
5. **Attribution**: Auto-generate frontmatter linking chapters to the Novel and Author.

## 7. Development Progress
- [x] Initial PRD and Architecture setup.
- [x] Jane Austen author metadata created.
- [x] ETL Pipeline repository initialized (`/Documents/Kapisce/etl-pipelines`).
- [x] Baseline fragmentation script drafted (`fragmenter.py`).
- [ ] Run fragmentation on *Pride and Prejudice* (1342.md).
- [ ] Implement Svelte Speed Reader component.
- [ ] Integrate Capacitor for mobile testing.
