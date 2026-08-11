import { demoClinics } from '../data/demoClinics'
import { eligibilityRuleSet } from '../data/rules/eligibilityRules'
import { findNearbyClinics } from './clinicFinder'

const today = '2026-08-10'

function forRegion(region: string) {
  return findNearbyClinics(demoClinics, region, eligibilityRuleSet, today)
}

function byId(list: ReturnType<typeof forRegion>, id: string) {
  return list.find((item) => item.clinic.id === id)!
}

describe('findNearbyClinics', () => {
  it('모든 의료기관을 담는다', () => {
    expect(forRegion('인천 미추홀구')).toHaveLength(demoClinics.length)
  })

  it('내 지역을 위로 올린다', () => {
    const list = forRegion('인천 미추홀구')

    expect(list[0].sameRegion).toBe(true)
  })

  it('같은 지역 의원은 초진 비대면이 열린다', () => {
    expect(byId(forRegion('인천 미추홀구'), 'clinic-han').firstVisitTelemedicine).toBe('allowed')
  })

  it('다른 지역이면 초진 비대면을 막고 이유를 준다', () => {
    const han = byId(forRegion('서울 강남구'), 'clinic-han')

    expect(han.firstVisitTelemedicine).toBe('blocked')
    expect(han.blockedReason).toContain('같은 지역만 가능')
  })

  it('비대면 미운영 의료기관은 지역이 같아도 막는다', () => {
    const skin = byId(forRegion('인천 미추홀구'), 'clinic-skin')

    expect(skin.telemedicineEnabled).toBe(false)
    expect(skin.blockedReason).toContain('운영하지 않는')
  })

  it('병원급은 예외 사유 안내를 준다', () => {
    expect(byId(forRegion('인천 미추홀구'), 'clinic-inha').blockedReason).toContain('병원급')
  })

  it('월 비율 상한을 넘긴 의원은 막는다', () => {
    const forest = byId(forRegion('서울 성동구'), 'clinic-forest')

    expect(forest.sameRegion).toBe(true)
    expect(forest.blockedReason).toContain('비율 상한')
  })

  it('오늘 진료 여부를 함께 준다', () => {
    expect(byId(forRegion('인천 미추홀구'), 'clinic-han').todayLabel).toBe('오늘 09:00–18:30')
    expect(
      findNearbyClinics(demoClinics, '인천 미추홀구', eligibilityRuleSet, '2026-08-09')[0].openToday,
    ).toBe(false)
  })

  it('같은 입력에 같은 순서를 준다', () => {
    expect(forRegion('인천 미추홀구')).toEqual(forRegion('인천 미추홀구'))
  })
})
