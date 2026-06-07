import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface UniversityTabsProps {
  activeSlug?: string
}

interface UniversityTab {
  id: number
  slug: string
}

export async function UniversityTabs({ activeSlug }: UniversityTabsProps) {
  const { data } = await supabase
    .from('universities')
    .select('id, slug')
    .order('name', { ascending: true })

  const tabs: UniversityTab[] = data ?? []
  if (tabs.length === 0) return null

  return (
    <nav className="tabs" aria-label="University channels">
      {tabs.map((tab) => {
        const isActive = activeSlug === tab.slug

        return (
          <Link
            key={tab.slug}
            href={`/${tab.slug}`}
            className={`tabItem ${isActive ? 'tabItemActive' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            /{tab.slug}/
          </Link>
        )
      })}
    </nav>
  )
}
