import { getCollection } from 'astro:content';
import type { NovelEntry, ChapterEntry } from '@/content/config';

export const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  ar: 'العربية',
  bn: 'বাংলা',
  de: 'Deutsch',
  es: 'Español',
  fa: 'فارسی',
  fr: 'Français',
  ha: 'Hausa',
  hi: 'हिन्दी',
  id: 'Bahasa Indonesia',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  ms: 'Bahasa Melayu',
  pt: 'Português',
  ru: 'Русский',
  sw: 'Kiswahili',
  th: 'ภาษาไทย',
  tr: 'Türkçe',
  vi: 'Tiếng Việt',
  'zh-tw': '繁體中文',
}

const KNOWN_LOCALES = new Set(Object.keys(LOCALE_NAMES))

export function extractLocale(chapterId: string): string {
  const slash = chapterId.indexOf('/')
  if (slash !== -1) {
    const prefix = chapterId.slice(0, slash)
    if (KNOWN_LOCALES.has(prefix)) return prefix
  }
  return 'en'
}

export function isNovelSubpost(novelId: string): boolean {
  return novelId.includes('/');
}

export function getNovelParentId(subpostId: string): string {
  return subpostId.split('/')[0];
}

export async function getAllNovels(): Promise<NovelEntry[]> {
  return await getCollection('novels');
}

export async function getTopLevelNovels(): Promise<NovelEntry[]> {
  const novels = await getAllNovels();
  return novels.filter((novel) => !isNovelSubpost(novel.id));
}

export async function getNovelSubposts(parentId: string): Promise<NovelEntry[]> {
  const novels = await getAllNovels();
  return novels.filter(
    (novel) => isNovelSubpost(novel.id) && getNovelParentId(novel.id) === parentId,
  );
}

export async function getAllChapters(): Promise<ChapterEntry[]> {
  const chapters = await getCollection('chapters');
  return chapters
    .filter((chapter) => !chapter.data.draft)
    .sort((a, b) => a.data.chapter_number - b.data.chapter_number);
}

export async function getChaptersByNovel(novelId: string, locale?: string): Promise<ChapterEntry[]> {
  const chapters = await getCollection('chapters');
  return chapters
    .filter((chapter) => {
      if (chapter.data.draft || chapter.data.novel !== novelId) return false
      if (locale !== undefined && extractLocale(chapter.id) !== locale) return false
      return true
    })
    .sort((a, b) => a.data.chapter_number - b.data.chapter_number);
}

export async function getNovelById(novelId: string): Promise<NovelEntry | null> {
  const novels = await getAllNovels();
  return novels.find((novel) => novel.id === novelId) || null;
}

export async function getLocaleVariants(
  chapterNumber: number,
  novelId: string,
  currentLocale: string,
): Promise<{ locale: string; id: string }[]> {
  const chapters = await getCollection('chapters')
  const variants: { locale: string; id: string }[] = []
  for (const chapter of chapters) {
    if (chapter.data.draft) continue
    if (chapter.data.novel !== novelId) continue
    if (chapter.data.chapter_number !== chapterNumber) continue
    const locale = extractLocale(chapter.id)
    if (locale === currentLocale) continue
    // For English, prefer the plain (non-enhanced) chapter
    const existing = variants.find((v) => v.locale === locale)
    if (existing) {
      if (!chapter.id.includes('-enhanced')) existing.id = chapter.id
    } else {
      variants.push({ locale, id: chapter.id })
    }
  }
  return variants.sort((a, b) => {
    if (a.locale === 'en') return -1
    if (b.locale === 'en') return 1
    return a.locale.localeCompare(b.locale)
  })
}

export async function getAdjacentChapters(currentId: string, novelId: string): Promise<{
  newer: ChapterEntry | null
  older: ChapterEntry | null
}> {
  const locale = extractLocale(currentId)
  const chapters = await getChaptersByNovel(novelId, locale);
  const currentIndex = chapters.findIndex((chapter) => chapter.id === currentId);

  if (currentIndex === -1) {
    return { newer: null, older: null };
  }

  return {
    newer: currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null,
    older: currentIndex > 0 ? chapters[currentIndex - 1] : null,
  };
}
