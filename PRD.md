# PRD: Kapisce Classics - Jane Austen Edition

## 1. Vision & Goals
Transform public domain classics into a "Content-First" digital experience. We are starting with **Jane Austen** to establish the pattern for author attribution and high-quality reader components.

## 2. Architecture (Kapisce-Stack)
- **Framework**: Astro (Content Collections for books).
    - **Collections**:
        - `authors`: Biographies and attribution metadata.
        - `novels`: High-level novel metadata (titles, covers, descriptions).
        - `chapters`: The primary reading content, separated from the blog to prevent ID collisions and allow for novel-specific routing logic.
        - `blog`: Standard editorial content and news.
    - **Type Safety**: Use a centralized `AnyCollectionEntry` and `ArticleEntry` union in `src/lib/data-utils.ts` to allow components like `BlogCard` and `PostHead` to handle multiple collection types safely.
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
3. **Reader View**: `/chapters/pride-and-prejudice-chapter-1` (Dedicated reading experience with `novel-utils.ts` navigation logic).

## 5. Content Pipeline (ETL)
We will utilize Python scripts (run via `pixi` in `Documents`) to transform raw HTML/MD classics:
1. **Scrape**: Fetch from Project Gutenberg or similar.
2. **Translate**: Convert HTML to clean Markdown.
3. **Fragment**: Split large book files into chapter-sized blocks.
4. **Sanitize**: Use the `text-cleaner` skill to transform Pandoc artifacts into MDX components (`<DropCap />`, `<PageMarker />`, etc.).
5. **SEO Optimization**: Transform chapters into the dedicated `src/content/chapters/` collection.
5. **Illustration Loop**: 10 chapters/day using Nano Banana in a highly detailed Renaissance style. Includes character consistency checks and a centralized `characters.md`.
6. **Attribution**: Auto-generate frontmatter linking chapters to the Novel and Author.

## 8. Collection Management Standards
To maintain type safety when adding new collections:
1.  **Define in `config.ts`**: Add the collection to `export const collections`.
2.  **Export Type Alias**: Add an exported type like `export type NewCollectionEntry = CollectionEntry<'new_collection'>`.
3.  **Update Global Unions**: Add the new type to `AnyCollectionEntry` (for all entries) and `ArticleEntry` (if it follows the title/description pattern) in `src/lib/data-utils.ts`.
4.  **Component Property Access**: When using shared components (e.g., `BlogCard`), use type guards or casting (`(entry.data as any)`) if the schemas vary significantly, or ensure the new collection adheres to the `ArticleEntry` interface.
