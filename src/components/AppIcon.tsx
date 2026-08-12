export type AppIconName =
  | 'home'
  | 'stories'
  | 'ask'
  | 'news'
  | 'me'
  | 'map'
  | 'calendar'
  | 'answer'
  | 'empathy'
  | 'trend'

const paths: Record<AppIconName, React.ReactNode> = {
  home: <path d="M3.5 10.5 12 3l8.5 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-5v6H5a1.5 1.5 0 0 1-1.5-1.5z" />,
  stories: (
    <>
      <path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M7 8h10M7 12h7" />
    </>
  ),
    ask: (
      <>
        <text
          x="12"
          y="16"
          fill="currentColor"
          stroke="none"
          textAnchor="middle"
          fontSize="12"
          fontWeight="800"
        >
          Q
        </text>
      </>
  ),
  news: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </>
  ),
  me: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  map: (
    <>
      <path d="M9 3 3 5.5v15L9 18l6 3 6-2.5v-15L15 6Z" />
      <path d="M9 3v15M15 6v15" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  answer: <path d="M20.5 14.5a2 2 0 0 1-2 2H9l-4.5 4v-14a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z" />,
  empathy: <path d="M12 20.3C8.4 17.4 4 14 4 10.2A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 8 2.2c0 3.8-4.4 7.2-8 10.1Z" />,
  trend: (
    <>
      <path d="M3.5 16.5 9.5 10.5l3.5 3.5 7-7" />
      <path d="M15.5 7h5v5" />
    </>
  ),
}

interface AppIconProps {
  name: AppIconName
  /** 숫자·라벨 옆에 끼워 넣는 작은 크기. 탭 아이콘은 24px 그대로 쓴다. */
  inline?: boolean
}

export function AppIcon({ name, inline = false }: AppIconProps) {
  return (
    <svg className={inline ? 'app-icon is-inline' : 'app-icon'} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}
