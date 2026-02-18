import type { CollectionEntry } from 'astro:content'

export type AuthorEntry = CollectionEntry<'authors'>
export type NovelEntry = CollectionEntry<'novels'>
export type ChapterEntry = CollectionEntry<'chapters'>
export type BlogEntry = CollectionEntry<'blog'>
export type ProjectEntry = CollectionEntry<'projects'>

export type KapisceEntry =
  | AuthorEntry
  | NovelEntry
  | ChapterEntry
  | BlogEntry
  | ProjectEntry
