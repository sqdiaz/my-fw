import crypto from 'crypto'
import { supabase } from '@/lib/supabase'

const HASH_SALT = process.env.HASH_SALT || 'default_salt'

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (!forwardedFor) return '127.0.0.1'
  return forwardedFor.split(',')[0].trim()
}

export function getPhilippinesDateKey(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
  })
  return formatter.format(new Date())
}

export function generateAnonHash(ip: string, dateKey: string, threadRootId: string): string {
  return crypto
    .createHash('sha256')
    .update(`${ip}|${dateKey}|${threadRootId}|${HASH_SALT}`)
    .digest('hex')
}

export async function findThreadRootId(postId: string): Promise<string | null> {
  interface PostLink {
    id: string
    parent_id: string | null
  }

  let currentId: string | null = postId
  let safetyCounter = 0

  while (currentId && safetyCounter < 50) {
    const { data, error } = await supabase
      .from('posts')
      .select('id, parent_id')
      .eq('id', currentId)
      .single()

    const row = data as PostLink | null
    if (error || !row) return null
    if (!row.parent_id) return row.id

    currentId = row.parent_id
    safetyCounter += 1
  }

  return null
}
