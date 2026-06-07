import Link from 'next/link'

interface UniversityTabsProps {
  universities: UniversityTab[]
  activeSlug?: string
}

interface UniversityTab {
  id: number
  slug: string
  name?: string
}

export function UniversityTabs({ universities, activeSlug }: UniversityTabsProps) {
  if (universities.length === 0) {
    return <p className="tabsEmpty">No channels available yet.</p>
  }

  return (
    <nav className="tabs" aria-label="University channels">
      {universities.map((tab) => {
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
