import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { generateAnonHash, getClientIp, getPhilippinesDateKey } from '@/lib/forum'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const formData = await req.formData()
  const title = formData.get('title')
  const content = formData.get('content')
  const universitySlug = formData.get('university_slug')

  if (typeof content !== 'string' || content.trim().length < 2) {
    return NextResponse.json({ error: 'Post content is required.' }, { status: 400 })
  }

  if (typeof universitySlug !== 'string' || !universitySlug.trim()) {
    return NextResponse.json({ error: 'University channel is required.' }, { status: 400 })
  }

  const { data: university, error: universityError } = await supabase
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

  const trimmedTitle = typeof title === 'string' ? title.trim() : ''
  const { error: insertError } = await supabase.from('posts').insert([
    {
      id: postId,
      title: trimmedTitle.length > 0 ? trimmedTitle : null,
      content: content.trim(),
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
