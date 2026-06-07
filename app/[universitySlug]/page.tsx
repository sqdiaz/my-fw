import Link from 'next/link'
import { notFound } from 'next/navigation'
import { UniversityTabs } from '@/components/university-tabs'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    universitySlug: string
  }
}

interface University {
  id: number
  slug: string
  name: string
}

interface ThreadPost {
  id: string
  title: string | null
  content: string
  author_hash: string
  created_at: string
}

export default async function UniversityPage({ params }: Props) {
  const { universitySlug } = params

  const { data: university } = await supabase
    .from('universities')
    .select('id, slug, name')
    .eq('slug', universitySlug)
    .single()

  if (!university) notFound()

  const { data: threads, error: threadError } = await supabase
    .from('posts')
    .select('id, title, content, author_hash, created_at')
    .eq('university_id', university.id)
    .is('parent_id', null)
    .order('created_at', { ascending: false })

  const threadList: ThreadPost[] = threads ?? []

  return (
    <main className="shell">
      <section className="card">
        <div className="banner">
          <Link href="/" className="hover:underline">
            home
          </Link>{' '}
          / {university.slug}
        </div>

        <h1 className="title">{university.name}</h1>
        <p className="muted">Channel: /{university.slug}/</p>
        <UniversityTabs activeSlug={university.slug} />

        <form action="/api/post" method="POST" className="formBox">
          <input type="hidden" name="university_slug" value={university.slug} />
          <input
            name="title"
            type="text"
            maxLength={120}
            placeholder="Thread title (optional)"
            className="input"
          />
          <textarea
            name="content"
            required
            minLength={2}
            maxLength={4000}
            placeholder="Start a thread..."
            className="textarea"
          />
          <button type="submit" className="button">
            post thread
          </button>
        </form>

        <h2 className="sectionHeading">threads</h2>
        {threadError && <p className="muted">Could not load threads: {threadError.message}</p>}
        {!threadError && threadList.length === 0 && <p className="muted">No posts yet.</p>}

        <div className="threadList">
          {threadList.map((thread) => (
            <article key={thread.id} className="threadCard">
              <Link href={`/${university.slug}/thread/${thread.id}`} className="threadTitle">
                {thread.title || '(untitled thread)'}
              </Link>
              <p className="threadMeta">
                anon:{thread.author_hash.slice(0, 10)} •{' '}
                {new Date(thread.created_at).toLocaleString('en-PH')}
              </p>
              <p className="threadPreview">{thread.content}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
