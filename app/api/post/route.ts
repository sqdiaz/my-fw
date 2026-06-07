import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { university_slug, content, parent_id, title } = await req.json();

    // 1. Extract IP address
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || '127.0.0.1';

    // 2. Generate anon hash for the day
    const dateYMD = new Date().toISOString().split('T')[0];
    const salt = process.env.HASH_SALT || '';
    const anonHash = crypto
      .createHash('md5')
      .update(ip + dateYMD + salt)
      .digest('hex');

    // 3. Validate
    if (!university_slug || !content) {
      return NextResponse.json(
        { error: 'university_slug and content are required' },
        { status: 400 }
      );
    }

    // 4. Insert into Supabase
    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          university_slug,
          content,
          parent_id: parent_id || null,
          title: title || null,
          anon_hash: anonHash,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 5. Return created post
    return NextResponse.json(data);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
