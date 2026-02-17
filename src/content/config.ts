import { defineCollection, z, type CollectionEntry } from 'astro:content';

export type AuthorEntry = CollectionEntry<'authors'>;
export type NovelEntry = CollectionEntry<'novels'>;
export type ChapterEntry = CollectionEntry<'chapters'>;
export type BlogEntry = CollectionEntry<'blog'>;
export type ProjectEntry = CollectionEntry<'projects'>;

export type KapisceEntry = AuthorEntry | NovelEntry | ChapterEntry | BlogEntry | ProjectEntry;

const authors = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    pronouns: z.string().optional(),
    avatar: z.string().url().or(z.string().startsWith('/')),
    bio: z.string().optional(),
    mail: z.string().email().optional(),
    website: z.string().url().optional(),
    twitter: z.string().url().optional(),
    github: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    discord: z.string().url().optional(),
  }),
});

const novels = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(), // Reference to author ID
    cover: z.string().optional(),
  }),
});

const chapters = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    authors: z.array(z.string()),
    novel: z.string(), // Reference to novel ID
    chapter_number: z.number(),
    image: image().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    image: image().optional(),
    tags: z.array(z.string()).optional(),
    authors: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
    order: z.number().optional(),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    name: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    image: image(),
    link: z.string().url(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});

export const collections = {
  'authors': authors,
  'novels': novels,
  'chapters': chapters,
  'blog': blog,
  'projects': projects,
};
