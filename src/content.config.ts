import { glob } from 'astro/loaders'
import { defineCollection, z, type CollectionEntry } from 'astro:content'

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      order: z.number().optional(),
      image: image().optional(),
      tags: z.array(z.string()).optional(),
      authors: z.array(z.string()).optional(),
      draft: z.boolean().optional(),
      novel: z.string().optional(),
    }),
})

const authors = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/authors' }),
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
})

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      image: image(),
      link: z.string().url(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    }),
})

const chapters = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/chapters' }),
  schema: ({ image }) =>
    z.object({
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
})

const novels = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/novels' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(), // Reference to author ID
    cover: z.string().optional(),
  }),
})

export const collections = { blog, authors, projects, chapters, novels }

export type NovelEntry = CollectionEntry<'novels'>
export type ChapterEntry = CollectionEntry<'chapters'>
