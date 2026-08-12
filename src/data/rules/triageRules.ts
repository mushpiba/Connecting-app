import type { TriageRuleSet } from '../../domain/types'

/**
 * 진료과 분류용 시연 규칙. 진단명이나 질병 확률을 만들지 않고 어느 과로 가면 되는지만 다룬다.
 * 실제 서비스에서는 이 자리에 LLM 분류가 들어가고 규칙셋은 검증용 기준선으로 남는다.
 */
export const triageRuleSet: TriageRuleSet = {
  name: '진료과 분류 시연 규칙',
  asOf: '2026-08-09',
  maxSuggestions: 3,
  relativeScoreFloor: 0.5,
  // 한 글자 키워드를 두지 않는다. 부분 문자열로 맞추기 때문에 '약'은 '예약'에,
  // '질'은 '질문'에, '잠'은 '잠깐'에 걸린다. 이 앱이 제일 많이 쓰는 말들이다.
  specialties: [
    {
      specialty: 'internal-medicine',
      label: '내과',
      keywords: ['소화', '속쓰림', '복통', '설사', '변비', '혈압', '당뇨', '피로', '체중', '구토', '메스꺼움'],
    },
    {
      specialty: 'family-medicine',
      label: '가정의학과',
      keywords: ['감기', '몸살', '미열', '건강검진', '예방접종', '만성', '재처방', '약을 먹', '약 처방'],
    },
    {
      specialty: 'otolaryngology',
      label: '이비인후과',
      keywords: ['콧물', '코막힘', '재채기', '인후통', '목아픔', '기침', '가래', '중이염', '어지럼', '이명', '비염'],
    },
    {
      specialty: 'dermatology',
      label: '피부과',
      keywords: ['두드러기', '발진', '가려움', '여드름', '습진', '탈모', '무좀', '피부'],
    },
    {
      specialty: 'orthopedics',
      label: '정형외과',
      keywords: ['허리', '무릎', '어깨', '관절', '삐끗', '염좌', '목디스크', '손목', '발목', '근육통'],
    },
    {
      specialty: 'psychiatry',
      label: '정신건강의학과',
      keywords: ['불면', '잠이 안', '잠을 못', '잠들기', '불안', '우울', '공황', '집중', '스트레스'],
    },
    {
      specialty: 'ophthalmology',
      label: '안과',
      keywords: ['눈이', '눈을', '눈에', '눈꺼풀', '시야', '충혈', '눈부심', '눈물', '결막'],
    },
    {
      specialty: 'obgyn',
      label: '산부인과',
      keywords: ['생리', '월경', '임신', '자궁', '질염', '분비물'],
    },
    {
      specialty: 'pediatrics',
      label: '소아청소년과',
      keywords: ['아이', '아기', '소아', '유아', '분유', '이유식'],
    },
    {
      specialty: 'urology',
      label: '비뇨의학과',
      keywords: ['소변', '배뇨', '방광', '전립선', '혈뇨'],
    },
  ],
  redFlags: [
    {
      id: 'chest-pain',
      label: '가슴 통증 또는 압박감',
      guidance: '심근경색 등 응급 가능성이 있습니다. 지금 119에 연락하거나 응급실로 가세요.',
      keywords: ['가슴통증', '가슴이 아프', '가슴 통증', '흉통', '가슴 압박', '식은땀'],
    },
    {
      id: 'stroke-signs',
      label: '뇌졸중 의심 징후',
      guidance: '한쪽 마비, 발음 이상, 심한 두통은 즉시 응급실 대상입니다. 지금 119에 연락하세요.',
      keywords: ['한쪽 마비', '말이 어눌', '발음이 이상', '갑작스러운 두통', '얼굴이 처', '마비'],
    },
    {
      id: 'breathing',
      label: '호흡곤란',
      guidance: '숨이 차거나 말을 잇기 어렵다면 응급 상황입니다. 지금 119에 연락하세요.',
      keywords: ['숨이 안', '숨쉬기 힘', '호흡곤란', '숨참'],
    },
    {
      id: 'bleeding',
      label: '멎지 않는 출혈 또는 토혈',
      guidance: '지혈이 되지 않거나 피를 토했다면 응급실로 가세요.',
      keywords: ['피를 토', '토혈', '멈추지 않는 출혈', '혈변', '각혈'],
    },
    {
      id: 'consciousness',
      label: '의식 저하',
      guidance: '의식이 흐려지거나 실신했다면 지금 119에 연락하세요.',
      keywords: ['의식이', '기절', '실신', '쓰러졌'],
    },
  ],
}
