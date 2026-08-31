import type { ExpressionHit } from '../domain/privateThread'

interface ExpressionFilterNoticeProps {
  hits: ExpressionHit[]
}

/**
 * 표현 필터에 걸렸을 때 그 자리에 서는 글 (§Q-5 §4).
 *
 * 「보내기」를 비활성으로 두지 않는다 — **비활성 버튼은 이유를 말하지 못한다.**
 * 눌렀을 때 걸린 자리를 보여 주고, 규칙마다 다른 문장을 낸다. 「부적절한
 * 표현입니다」로 뭉뚱그리면 무엇을 고쳐야 하는지 알 수 없다.
 *
 * **나갈 길은 버튼이 아니라 문구다.** 필터가 걸리는 것은 의사가 쓰는 글뿐이고,
 * 의사는 환자 대신 진료로 넘어갈 수 없다. 「진료가 필요합니다」 전환 버튼은
 * 환자 화면에 상시 있고(D-6 항목 6), 여기서는 각 규칙의 문구가 그 자리로
 * 넘기라고 적는다. 누를 수 없는 버튼을 그리는 것이 원칙 6 위반이다.
 */
export function ExpressionFilterNotice({ hits }: ExpressionFilterNoticeProps) {
  if (hits.length === 0) return null

  return (
    <div className="filter-block" role="alert" data-testid="expression-filter-block">
      <p className="filter-block-head">보내지 않았습니다. 아래 표현이 걸렸습니다.</p>
      <ul>
        {hits.map((hit) => (
          <li key={`${hit.ruleId}-${hit.index}`}>
            <span className="filter-rule-id">{hit.ruleId}</span> {hit.message}
          </li>
        ))}
      </ul>
    </div>
  )
}
