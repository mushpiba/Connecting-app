import { useState } from 'react'
import { demoRegions } from '../../data/demoClinics'
import { useSession } from '../../state/SessionContext'

/**
 * 여럿이 같은 게시판을 쓸 때 들어오는 문.
 *
 * 이름과 지역만 받는다. 실명도 연락처도 받지 않는다. 이 데모에는 사람에 관한
 * 값을 담을 자리가 없고, 담을 수 있게 만들면 넣게 된다.
 */
export function JoinScreen() {
  const { joinAs, status, error } = useSession()
  const [displayName, setDisplayName] = useState('')
  const [region, setRegion] = useState<string>(demoRegions[0])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    void joinAs(displayName.trim(), region)
  }

  return (
    <div className="join-screen">
      <div className="join-card">
        <p className="eyebrow">MEDIVU · 함께 테스트</p>
        <h1>어떤 이름으로 참여할까요</h1>
        <p className="join-lead">
          같은 게시판을 여럿이 함께 씁니다. 올린 사연은 참여한 사람들에게 보입니다.
        </p>

        <form className="intake-form" onSubmit={submit}>
          <label htmlFor="join-name">표시 이름</label>
          <input
            id="join-name"
            type="text"
            required
            maxLength={12}
            placeholder="예) 민이"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />

          <label htmlFor="join-region">사는 지역</label>
          <select
            id="join-region"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          >
            {demoRegions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="primary-cta"
            disabled={status === 'loading' || displayName.trim() === ''}
          >
            {status === 'loading' ? '들어가는 중…' : '참여하기'}
          </button>
        </form>

        {error && (
          <p className="gate-reason" role="alert">
            {error}
          </p>
        )}

        <p className="clinical-caveat">
          테스트용 계정입니다. 실제 증상이나 개인정보를 적지 마세요. 처음에는 모두 환자이며,
          의사 화면은 주최자가 따로 열어 줍니다.
        </p>
      </div>
    </div>
  )
}
