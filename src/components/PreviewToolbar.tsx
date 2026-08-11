export type PreviewMode = 'web' | 'app'

interface PreviewToolbarProps {
  mode: PreviewMode
  onChange: (mode: PreviewMode) => void
}

export function PreviewToolbar({ mode, onChange }: PreviewToolbarProps) {
  return (
    <nav className="preview-toolbar" aria-label="화면 보기">
      <span>화면 미리보기</span>
      <div>
        <button
          type="button"
          aria-pressed={mode === 'web'}
          className={mode === 'web' ? 'is-active' : ''}
          onClick={() => onChange('web')}
        >
          웹 보기
        </button>
        <button
          type="button"
          aria-pressed={mode === 'app'}
          className={mode === 'app' ? 'is-active' : ''}
          onClick={() => onChange('app')}
        >
          앱 미리보기
        </button>
      </div>
    </nav>
  )
}
