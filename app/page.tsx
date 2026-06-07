import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface University {
  id: number
  slug: string
  name: string
}

export default async function Home() {
  const { data: universities, error } = await supabase
    .from('universities')
    .select('id, slug, name')
    .order('name', { ascending: true })

  const universityList: University[] = universities ?? []

  if (error) {
    return (
      <main className="shell">
        <div className="card">
          <h1 className="title">Campus Wall PH</h1>
          <p className="muted">Could not load universities: {error.message}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="shell">
      <section className="card">
        <div className="banner">campuswall.ph</div>
        <h1 className="title">Campus Wall PH</h1>
        <p className="muted">
          Anonymous university channels. No logins, no profiles, just threads.
        </p>

        <div className="channelList">
          {universityList.map((university) => (
            <Link key={university.id} href={`/${university.slug}`} className="channelItem">
              <span className="channelSlug">/{university.slug}/</span>
              <span>{university.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
