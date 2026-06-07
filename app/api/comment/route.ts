import { NextResponse } from 'next/server'
import { findThreadRootId, generateAnonHash, getClientIp, getPhilippinesDateKey } from '@/lib/forum'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const formData = await req.formData()
  const content = formData.get('content')
  const parentId = formData.get('parent_id')

  if (typeof content !== 'string' || content.trim().length < 2) {
    return NextResponse.json({ error: 'Comment content is required.' }, { status: 400 })
  }

  if (typeof parentId !== 'string' || !parentId.trim()) {
    return NextResponse.json({ error: 'Parent post is required.' }, { status: 400 })
  }

  const { data: parentPost, error: parentError } = await supabase
    .from('posts')
    .select('id, university_id')
    .eq('id', parentId)
    .single()

  if (parentError || !parentPost) {
    return NextResponse.json({ error: 'Invalid parent post.' }, { status: 400 })
  }

  const rootId = await findThreadRootId(parentPost.id)
  if (!rootId) {
    return NextResponse.json({ error: 'Could not resolve thread root.' }, { status: 400 })
  }

  const ip = getClientIp(req)
  const dateKey = getPhilippinesDateKey()
  const authorHash = generateAnonHash(ip, dateKey, rootId)

  const { error: insertError } = await supabase.from('posts').insert([
    {
      content: content.trim(),
      parent_id: parentPost.id,
      university_id: parentPost.university_id,
      author_hash: authorHash,
      upvotes: 0,
    },
  ])

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const referer = req.headers.get('referer')
  if (referer) {
    return NextResponse.redirect(referer, 303)
  }

  return NextResponse.json({ success: true })
}
