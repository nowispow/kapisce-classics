import { SITE } from '@/consts'
import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'

export async function GET(context: APIContext) {
  try {
    const chapters = await getCollection('chapters', ({ data }) => !data.draft)
    chapters.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())

    return rss({
      title: SITE.title,
      description: SITE.description,
      site: context.site ?? SITE.href,
      items: chapters.map((chapter) => ({
        title: chapter.data.title,
        description: chapter.data.description,
        pubDate: chapter.data.date,
        link: `/chapters/${chapter.id}/`,
      })),
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new Response('Error generating RSS feed', { status: 500 })
  }
}
