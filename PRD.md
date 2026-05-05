# PRD: Kapisce Classics

## 1. Vision & Goals

Transform public domain classics into a "Content-First" digital experience for educators and book-club leaders. Starting with **Jane Austen** to establish the pattern for annotated, illustrated editions sold per-edition.

**Primary audience:** Educators and book-club leaders  
**Monetization model:** Per-edition purchase (enhanced/annotated editions; plain text free)  
**Data philosophy:** Self-hosted, open-source services only — GDPR compliance by design

---

## 2. Architecture (Kapisce-Stack)

| Layer | Technology |
|---|---|
| Framework | Astro 6 (SSG, Content Collections) |
| Styling | Tailwind CSS v4, shadcn/ui (React) |
| Interactive | Svelte islands (SpeedReader, forms) |
| Cross-platform | PWA first; Capacitor (iOS/Android) later |
| Backend API | Fastify (Dokploy) — forms, webhooks, auth |
| Email | Listmonk (Dokploy) + Resend (SMTP relay) |
| Analytics | PostHog self-hosted (Dokploy) |
| Monetization | Lemon Squeezy (Merchant of Record, handles EU VAT) |
| CI/CD | Gitea Actions → Dokploy (static deploy) |
| Monitoring | Uptime Kuma (Dokploy) |

---

## 3. Production-Ready Checklist

### Phase 0 — Foundation
*Clean up, brand, and make legally ready. Do this before any public traffic.*

#### Branding & Template Cleanup
- [X] Fix `src/consts.ts`: `description`, `href` (→ `https://kapisce.com`), `author` (→ `kapisce`), `SOCIAL_LINKS` (replace template author links with Kapisce accounts)
- [X] Fix `package.json`: `name` from `astro-erudite` → `kapisce-classics`
- [X] Fix `public/site.webmanifest`: `name` and `short_name` from `astro-erudite` → `Kapisce`
- [X] Fix `astro.config.ts`: `site` from `https://astro-erudite.vercel.app` → `https://kapisce.com`
- [X] Fix `README.md`: replace template boilerplate with Kapisce description
- [X] Remove template blog posts from `src/content/blog/` (the demo callouts post, state-of-static-blogs post, etc.)
- [X] Create `.env.example` documenting all environment variables with descriptions and example values

#### Legal & Compliance
- [X] Add Terms of Service page (`src/pages/terms.astro` → `/terms`)
- [X] Add Privacy Policy page (`src/pages/privacy.astro` → `/privacy`) — GDPR-compliant; list all data processors (PostHog, Listmonk, Resend, Lemon Squeezy)
- [X] Add EULA page (`src/pages/eula.astro` → `/eula`) — covers digital content license for purchased editions
- [X] Add Data Processing Agreement page (`src/pages/dpa.astro` → `/dpa`) — for EU users/organizations
- [ ] TODO: Add cookie consent banner — use **Klaro** (open source, GDPR-compliant; blocks PostHog until consent)
- [X] Update `src/components/Footer.astro`: add links to `/terms`, `/privacy`, `/eula`, `/dpa`
- [X] Fix `LICENSE`: clarify dual license — CC BY-NC 4.0 for content, MIT for code

#### Developer Experience
- [X] Create `CLAUDE.md` at repo root with: project conventions, content pipeline steps, collection management rules (from Section 6), MCP connection details (once set up)

---

### Phase 1 — Validation
*Deploy analytics and email capture to run the demand experiment.*

#### Analytics
- [ ] Deploy **PostHog** (self-hosted) on Dokploy at `analytics.kapisce.com`
- [ ] Inject PostHog snippet in `src/components/Head.astro` — gated behind Klaro cookie consent for EU users
- [ ] Instrument key events:
  - `chapter_read` — on chapter page load
  - `chapter_complete` — SpeedReader reaches 100% or scroll depth > 90%
  - `signup_form_submit` — on successful form POST
  - `edition_preview` — on enhanced chapter paywall view (Phase 2)
  - `purchase_start` — on Lemon Squeezy checkout open (Phase 2)
- [ ] Create PostHog dashboard: pageviews, signup funnel, chapter engagement, locale breakdown

#### Email & Lead Capture
- [ ] Deploy **Listmonk** (self-hosted) on Dokploy at `mail.kapisce.com`
- [ ] Configure **Resend** as Listmonk's SMTP relay (free tier: 3,000 emails/month)
- [ ] Create subscriber lists in Listmonk: `educators`, `book-club-leaders`, `general-readers`, `waitlist`
- [ ] Build `SignupForm` Svelte component: fields — email (required), role (select: educator / book-club leader / reader), group size (select: just me / 2–10 / 11–50 / 50+) — POST to Listmonk API
- [ ] Add `SignupForm` to `src/pages/index.astro` (hero section) and `src/pages/novels/[novel].astro` (below novel description)
- [ ] Configure Listmonk welcome email automation (trigger: new subscriber)
- [ ] Set up subscriber segmentation by role field

#### Forms & API Backend
- [ ] Deploy **Fastify API** on Dokploy at `api.kapisce.com` — handles: form proxying, Lemon Squeezy webhooks, future auth
- [ ] Build contact form (`src/pages/contact.astro` → `/contact`): name, email, subject (partnership / bulk licensing / press / other), message — POST to Fastify
- [ ] Build chapter feedback form component (embedded in chapter footer): rating (1–5), comment (optional) — POST to Fastify
- [ ] Add rate limiting on all Fastify endpoints (per-IP: 10 req/min for forms)
- [ ] Update `.env.example` with: `POSTHOG_HOST`, `POSTHOG_KEY`, `LISTMONK_URL`, `LISTMONK_API_KEY`, `RESEND_API_KEY`, `API_BASE_URL`

#### Demand Experiment (from `experiment-v0/plan.md`)
- [ ] Draft community launch posts for Reddit (r/bookclub, r/ClassicLit, r/Austen, r/Teachers), Facebook educator groups, Discord literature servers — save to `docs/marketing/community-posts.md`
- [ ] Define success thresholds in a results doc: ≥5% conversion + ≥50 signups + ≥40% educator/book-club roles → proceed to Phase 2
- [ ] Record experiment results in `docs/marketing/results.md` after 14-day window

---

### Phase 2 — Monetization
*Gate enhanced chapters behind payment. Only start after Phase 1 validates demand.*

#### Store & Payments
- [ ] Set up **Lemon Squeezy** store — products: individual enhanced editions (e.g., "Pride & Prejudice Enhanced Edition"), bundles
- [ ] Build store/pricing page (`src/pages/store.astro` → `/store`) with edition cards and "Buy" CTAs
- [ ] Integrate Lemon Squeezy JS SDK for checkout overlay
- [ ] Add "Buy Enhanced Edition" CTA to novel pages (`src/pages/novels/[novel].astro`)
- [ ] Build Lemon Squeezy webhook handler in Fastify: purchase event → generate/store license key → send delivery email via Listmonk

#### Access Control
- [ ] Build `PaywallGate` Astro component: checks localStorage for valid license key; if locked — shows first 3 paragraphs + purchase CTA; if unlocked — renders full enhanced content
- [ ] Modify `src/pages/chapters/[...id].astro` to wrap enhanced chapter content in `PaywallGate` (detect `*-enhanced` in entry ID)
- [ ] Add `/api/verify-license` endpoint to Fastify for periodic revalidation of stored keys
- [ ] Build license key entry UI (modal or inline form on locked chapters)

#### Educator / Bulk Licensing
- [ ] Create bulk licensing product tiers in Lemon Squeezy (10, 25, 50, 100 seats)
- [ ] Add "Educator Pricing" section to `/store` with volume tier table and inquiry form for custom volumes (> 100 seats)
- [ ] Build license distribution: educator purchases bulk → Fastify generates unique seat keys or single group code → delivered by email

---

### Phase 3 — Scale
*Grow audience and expand catalog once revenue is flowing.*

#### SEO
- [ ] Fix canonical URLs: `src/components/PageHead.astro` and `PostHead.astro` — use `Astro.url.href` instead of hardcoded `SITE.href`
- [ ] Fix site description in `src/consts.ts` — currently set to astro-erudite template description
- [ ] Add Schema.org JSON-LD to chapter pages: `Chapter` with `isPartOf` → `Book`
- [ ] Add Schema.org JSON-LD to novel pages: `Book` with `author`, `inLanguage`
- [ ] Add Schema.org JSON-LD to author pages: `Person`
- [ ] Add `hreflang` alternate `<link>` tags on chapter pages for the 20 locale variants (data already exists via locale directories)
- [ ] Verify `@astrojs/sitemap` emits URLs for all 1,400+ chapter routes across locales
- [ ] Update `src/pages/robots.txt.ts`: disallow `/test/`, `/api/`
- [ ] Generate dynamic OG images per chapter/novel (script or build-time generation)

#### Marketing & Community
- [ ] Update `SOCIAL_LINKS` in `src/consts.ts` with actual Kapisce social accounts
- [ ] Build share button on chapter pages: Web Share API + clipboard fallback
- [ ] Write blog posts: annotation methodology, why classics matter for educators, speed reading public domain literature, the multilingual edition
- [ ] Set up monthly Listmonk newsletter campaign template (new chapters, translations, annotations digest)
- [ ] Evaluate PWA (lighter): fix `site.webmanifest`, add service worker for offline chapter caching, add install prompt

#### Content Pipeline
- [ ] Document novel addition workflow in `CLAUDE.md` or `docs/content-pipeline.md`:
  1. Source from Project Gutenberg
  2. Convert via Pandoc → MDX
  3. Split into chapter files (`src/content/chapters/{novel}-ch-{n}.mdx`)
  4. Add frontmatter (title, description, date, authors, novel ref, chapter_number, tags)
  5. Generate enhanced version with `Callout` annotations → `{novel}-ch-{n}-enhanced.mdx`
  6. Generate translations for target locales → `src/content/chapters/{locale}/{filename}.mdx`
  7. Generate illustrations → `public/static/illustrations/{novel}/ch-{n}/`
  8. Update novel collection entry in `src/content/novels/`
- [ ] Document illustration generation style guide and storage convention
- [ ] Add Sense & Sensibility enhanced chapters (currently only plain exist)

---

### Phase 4 — Operations
*Harden for sustained autonomous operation.*

#### Monitoring & Reliability
- [ ] Deploy **Uptime Kuma** on Dokploy: monitor `kapisce.com`, `analytics.kapisce.com`, `mail.kapisce.com`, `api.kapisce.com`; alert via Resend email on downtime
- [ ] Set up backup strategy: daily `pg_dump` of Listmonk PostgreSQL and PostHog PostgreSQL to encrypted S3-compatible storage; test restore procedure
- [ ] Enable PostHog session replay and error tracking
- [ ] Configure Docker log rotation on all Dokploy services

#### Security Hardening
- [ ] Add CSP headers via Dokploy reverse proxy or Astro middleware: `default-src 'self'`; whitelist PostHog host, Lemon Squeezy, Klaro CDN (if any)
- [ ] Add headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(), microphone=()`
- [ ] Configure CORS on Fastify API: `origin: 'https://kapisce.com'` only
- [ ] Add `npm audit` step to `.gitea/workflows/pr-workflow.yml`
- [ ] Add Playwright tests to CI workflow

#### Performance & Accessibility
- [ ] Add Lighthouse CI to PR workflow — budgets: LCP < 2.5s, CLS < 0.1; a11y target 95+
- [ ] Accessibility audit: keyboard navigation for SpeedReader controls and theme toggle, color contrast in both themes, skip-to-content link in `src/layouts/Layout.astro`, alt text on all `IllustratedFigure` instances
- [ ] Switch SpeedReader hydration from `client:load` to `client:visible`

#### MCP Integrations (Claude Autopilot)
- [ ] Set up **Gitea MCP server** (`gitea-mcp` or official Gitea MCP) — enables Claude to: create/manage issues, open PRs for content additions, create version tags to trigger deploys, review and merge PRs
- [ ] Set up **Dokploy MCP server** — enables Claude to: check service health, trigger redeployments, view logs for debugging
- [ ] Set up Listmonk API access for Claude — subscriber growth reports, campaign scheduling, segment analysis
- [ ] Set up PostHog API access for Claude — engagement dashboards, funnel conversion reports, experiment results
- [ ] Document all MCP connection details, tokens, and available operations in `CLAUDE.md`

---

## 4. Content Pipeline (ETL)

Prioritize high-fidelity markdown sources (Pandoc-converted from Project Gutenberg) over raw text to preserve original formatting. See the content pipeline checklist in Phase 3 above for the step-by-step workflow.

**Two reading modes per chapter:**
- **Plain** — free, public domain text with minimal formatting
- **Enhanced** — paid; adds `Callout` annotations, AI-generated `IllustratedFigure` scenes, footnotes

**Translation structure:** `src/content/chapters/{locale}/{chapter-filename}.mdx` — 20 locales currently seeded with P&P chapters 1–5.

---

## 5. User Navigation Flow

1. **Home** `/` — hero with signup form (Phase 1) and featured novels
2. **Author Hub** `/authors/jane-austen` — bio + list of novels
3. **Novel Landing** `/novels/pride-and-prejudice` — TOC, description, buy CTA (Phase 2)
4. **Chapter Reader** `/chapters/pride-and-prejudice-ch-1` — plain or enhanced (gated)
5. **Store** `/store` — edition pricing, educator tiers (Phase 2)

---

## 6. Collection Management Standards

To maintain type safety when adding new collections:

1. **Define in `src/content.config.ts`**: Add the collection to `export const collections`.
2. **Export Type Alias**: Add `export type NewCollectionEntry = CollectionEntry<'new_collection'>`.
3. **Update Global Unions**: Add the new type to `AnyCollectionEntry` and `ArticleEntry` (if it follows the title/description pattern) in `src/lib/data-utils.ts`.
4. **Component Property Access**: Use type guards or casting `(entry.data as any)` if schemas vary significantly, or ensure the new collection adheres to the `ArticleEntry` interface.
