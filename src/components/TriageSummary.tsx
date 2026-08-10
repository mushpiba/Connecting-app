import type { TriageResult } from '../domain/types'

interface TriageSummaryProps {
  triage: TriageResult
}

export function TriageSummary({ triage }: TriageSummaryProps) {
  return (
    <section className="triage-summary" aria-labelledby="triage-summary-heading">
      <h2 id="triage-summary-heading">어느 과로 가면 좋을까요</h2>

      {triage.redFlags.length > 0 && (
        <div className="red-flag-callout" role="alert">
          <strong>지금 응급실이나 119를 먼저 확인하세요</strong>
          <ul>
            {triage.redFlags.map((flag) => (
              <li key={flag.id}>
                <strong>{flag.label}</strong> — {flag.guidance}
              </li>
            ))}
          </ul>
        </div>
      )}

      {triage.suggestions.length === 0 ? (
        <p className="triage-empty">
          적어 주신 내용만으로는 진료과를 좁히지 못했습니다. 증상을 조금 더 적어 주시거나 가정의학과에
          먼저 문의해 보세요.
        </p>
      ) : (
        <ul className="specialty-list">
          {triage.suggestions.map((suggestion) => (
            <li key={suggestion.specialty} className="specialty-item">
              <span className="specialty-label">{suggestion.label}</span>
              <span className="specialty-evidence">
                {suggestion.matchedKeywords.map((keyword) => (
                  <span key={keyword} className="evidence-chip">
                    {keyword}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="clinical-caveat">
        진료과 안내이며 진단이 아닙니다. 적용 규칙 {triage.ruleSetName} · 기준일 {triage.ruleSetAsOf}
      </p>
    </section>
  )
}
