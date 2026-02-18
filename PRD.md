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
We prioritize high-fidelity markdown sources (Pandoc-converted) over raw text to preserve the author's original intent and formatting.

## 6. Collection Management Standards
To maintain type safety when adding new collections:
1.  **Define in `config.ts`**: Add the collection to `export const collections`.
2.  **Export Type Alias**: Add an exported type like `export type NewCollectionEntry = CollectionEntry<'new_collection'>`.
3.  **Update Global Unions**: Add the new type to `AnyCollectionEntry` (for all entries) and `ArticleEntry` (if it follows the title/description pattern) in `src/lib/data-utils.ts`.
4.  **Component Property Access**: When using shared components (e.g., `BlogCard`), use type guards or casting (`(entry.data as any)`) if the schemas vary significantly, or ensure the new collection adheres to the `ArticleEntry` interface.
