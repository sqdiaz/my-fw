import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { generateAnonHash, getClientIp, getPhilippinesDateKey } from '@/lib/forum'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  const formData = await req.formData()
  const title = formData.get('title')
  const content = formData.get('content')
  const universitySlug = formData.get('university_slug')

  const trimmedTitle = typeof title === 'string' ? title.trim() : ''
  const trimmedContent = typeof content === 'string' ? content.trim() : ''

  if (trimmedTitle.length < 4) {
    return NextResponse.json({ error: 'Thread title must be at least 4 characters.' }, { status: 400 })
  }

  if (trimmedTitle.length > 120) {
    return NextResponse.json({ error: 'Thread title must be 120 characters or less.' }, { status: 400 })
  }

  if (trimmedContent.length > 4000) {
    return NextResponse.json({ error: 'Thread body must be 4000 characters or less.' }, { status: 400 })
  }

  if (typeof universitySlug !== 'string' || !universitySlug.trim()) {
    return NextResponse.json({ error: 'University channel is required.' }, { status: 400 })
  }

  const { data: university, error: universityError } = await supabaseAdmin
    .from('universities')
    .select('id, slug')
    .eq('slug', universitySlug.trim())
    .single()

  if (universityError || !university) {
    return NextResponse.json({ error: 'Invalid university channel.' }, { status: 400 })
  }

  const postId = randomUUID()
  const ip = getClientIp(req)
  const dateKey = getPhilippinesDateKey()
  const authorHash = generateAnonHash(ip, dateKey, postId)

  const { error: insertError } = await supabaseAdmin.from('posts').insert([
    {
      id: postId,
      title: trimmedTitle,
      content: trimmedContent,
      university_id: university.id,
      parent_id: null,
      author_hash: authorHash,
      upvotes: 0,
    },
  ])

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL(`/${university.slug}/thread/${postId}`, req.url), 303)
}
