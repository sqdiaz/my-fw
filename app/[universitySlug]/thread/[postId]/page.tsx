import Link from 'next/link'
import { notFound } from 'next/navigation'
import { UniversityTabs } from '@/components/university-tabs'
import { getPostCode } from '@/lib/forum'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    universitySlug: string
    postId: string
  }
}

interface University {
  id: number
  slug: string
  name: string
}

interface Post {
  id: string
  university_id: number
  parent_id: string | null
  title: string | null
  content: string
  author_hash: string
  created_at: string
}

function collectThreadPosts(rootId: string, posts: Post[]): Post[] {
  const byParent = new Map<string | null, Post[]>()
  for (const post of posts) {
    const list = byParent.get(post.parent_id) || []
    list.push(post)
    byParent.set(post.parent_id, list)
  }

  const ordered: Post[] = []
  const visit = (parentId: string) => {
    const children = byParent.get(parentId) || []
    children.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    for (const child of children) {
      ordered.push(child)
      visit(child.id)
    }
  }
  visit(rootId)
  return ordered
}

function renderReplyLinks(content: string, validCodes: Set<string>) {
  const chunks = content.split(/(>>[a-zA-Z0-9]{8})/g)
  return chunks.map((chunk, index) => {
    const match = chunk.match(/^>>([a-zA-Z0-9]{8})$/)
    if (!match) return chunk

    const code = match[1].toUpperCase()
    if (!validCodes.has(code)) return `>>${code}`

    return (
      <Link key={`${code}-${index}`} href={`#comment-${code}`} className="replyPointer">
        {`>>${code}`}
      </Link>
    )
  })
}

export default async function ThreadPage({ params }: Props) {
  const { universitySlug, postId } = params

  const [{ data: university }, { data: allUniversities }] = await Promise.all([
    supabase.from('universities').select('id, slug, name').eq('slug', universitySlug).single(),
    supabase.from('universities').select('id, slug, name').order('name', { ascending: true }),
  ])

  if (!university) notFound()

  const { data: rootPost } = await supabase
    .from('posts')
    .select('id, university_id, parent_id, title, content, author_hash, created_at')
    .eq('id', postId)
    .eq('university_id', university.id)
    .is('parent_id', null)
    .single()

  if (!rootPost) notFound()

  const { data: allPosts } = await supabase
    .from('posts')
    .select('id, university_id, parent_id, title, content, author_hash, created_at')
    .eq('university_id', university.id)
    .order('created_at', { ascending: true })

  const universityPosts: Post[] = allPosts ?? []
  const universityTabs: University[] = allUniversities ?? []
  const threadComments = collectThreadPosts(rootPost.id, universityPosts).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const postCodeById = new Map<string, string>(
    threadComments.map((comment) => [comment.id, getPostCode(comment.id)])
  )
  const validCodes = new Set(postCodeById.values())

  return (
    <main className="shell">
      <section className="card">
        <div className="banner">
          <Link href="/" className="hover:underline">
            home
          </Link>{' '}
          /{' '}
          <Link href={`/${university.slug}`} className="hover:underline">
            {university.slug}
          </Link>{' '}
          / thread
        </div>
        <UniversityTabs universities={universityTabs} activeSlug={university.slug} />

        <div className="threadLead">
          <h1 className="threadLeadTitle">{rootPost.title || '(untitled thread)'}</h1>
          <p className="threadMeta">
            anon:{rootPost.author_hash.slice(0, 10)} • {new Date(rootPost.created_at).toLocaleString('en-PH')}
          </p>
          {rootPost.content.trim().length > 0 ? (
            <p className="threadPreview">{renderReplyLinks(rootPost.content, validCodes)}</p>
          ) : (
            <p className="threadEmpty">(no body)</p>
          )}
        </div>

        <form action="/api/comment" method="POST" className="formBox">
          <input type="hidden" name="parent_id" value={rootPost.id} />
          <textarea
            name="content"
            required
            minLength={2}
            maxLength={4000}
            placeholder="Add a comment..."
            className="textarea"
          />
          <button type="submit" className="button">
            add comment
          </button>
        </form>

        <h2 className="sectionHeading">replies</h2>
        {threadComments.length === 0 && <p className="muted">No comments yet.</p>}
        <div className="threadList">
          {threadComments.map((comment) => {
            const code = postCodeById.get(comment.id) ?? getPostCode(comment.id)
            const parentCode =
              comment.parent_id && comment.parent_id !== rootPost.id
                ? postCodeById.get(comment.parent_id) ?? null
                : null

            return (
              <article key={comment.id} id={`comment-${code}`} className="commentCard">
                <p className="threadMeta">
                  No.{code} • anon:{comment.author_hash.slice(0, 10)} •{' '}
                  {new Date(comment.created_at).toLocaleString('en-PH')}
                </p>
                {parentCode && (
                  <p className="replyingTo">
                    Replying to{' '}
                    <Link href={`#comment-${parentCode}`} className="replyPointer">
                      {parentCode}
                    </Link>
                  </p>
                )}
                <p className="threadPreview">{renderReplyLinks(comment.content, validCodes)}</p>

                <details>
                  <summary className="replyLink">reply</summary>
                  <form action="/api/comment" method="POST" className="replyForm">
                    <input type="hidden" name="parent_id" value={comment.id} />
                    <textarea
                      name="content"
                      required
                      minLength={2}
                      maxLength={4000}
                      placeholder="Write a reply..."
                      className="textarea"
                    />
                    <button type="submit" className="button">
                      post reply
                    </button>
                  </form>
                </details>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
