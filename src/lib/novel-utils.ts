import { getCollection } from 'astro:content';
import type { NovelEntry, ChapterEntry } from '@/content/config';

export async function getAllNovels(): Promise<NovelEntry[]> {
  return await getCollection('novels');
}

export async function getAllChapters(): Promise<ChapterEntry[]> {
  const chapters = await getCollection('chapters');
  return chapters
    .filter((chapter) => !chapter.data.draft)
    .sort((a, b) => a.data.chapter_number - b.data.chapter_number);
}

export async function getChaptersByNovel(novelId: string): Promise<ChapterEntry[]> {
  const chapters = await getCollection('chapters');
  return chapters
    .filter((chapter) => !chapter.data.draft && chapter.data.novel === novelId)
    .sort((a, b) => a.data.chapter_number - b.data.chapter_number);
}

export async function getNovelById(novelId: string): Promise<NovelEntry | null> {
  const novels = await getAllNovels();
  return novels.find((novel) => novel.id === novelId) || null;
}

export async function getAdjacentChapters(currentId: string, novelId: string): Promise<{
  newer: ChapterEntry | null
  older: ChapterEntry | null
}> {
  const chapters = await getChaptersByNovel(novelId);
  const currentIndex = chapters.findIndex((chapter) => chapter.id === currentId);

  if (currentIndex === -1) {
    return { newer: null, older: null };
  }

  return {
    newer: currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null,
    older: currentIndex > 0 ? chapters[currentIndex - 1] : null,
  };
}
