import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import crypto from 'crypto';

const HASH_SALT = process.env.HASH_SALT || 'default_salt';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const content = formData.get('content') as string;
    const parent_id = formData.get('parent_id') as string;
    const university_slug = formData.get('university_slug') as string | null;
    
    // Simple IP-based hashing
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const dateYMD = new Date().toISOString().split('T')[0];
    const author_hash = crypto
      .createHash('md5')
      .update(`${ip}-${dateYMD}-${HASH_SALT}`)
      .digest('hex');

    const { error } = await supabase
      .from('posts')
      .insert([
        {
          content,
          parent_id,
          university_slug, // Potentially null for deep replies
          author_hash,
          upvotes: 0
        }
      ]);

    if (error) throw error;

    // Redirect back to the post page
    const referer = req.headers.get('referer');
    if (referer) {
      return NextResponse.redirect(referer, 303);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
