import type { MedicationRuleSet } from '../../domain/types'

/**
 * 비대면 처방 제한 시연 데이터. 실제 목록은 급여 322품목 + 비급여 439품목, 총 761품목이며
 * 심평원에 공개되어 있다. 이 파일을 실데이터로 바꾸는 것이 다음 데이터 작업이다.
 */
export const medicationRuleSet: MedicationRuleSet = {
  source: 'HIRA 비대면 처방제한 의약품 목록 (시연용 발췌)',
  asOf: '2026-08-09',
  evidenceUrl:
    'https://www.hira.or.kr/bbsDummy.do?brdBltNo=11998&brdScnBltNo=4&pageIndex=1&pgmid=HIRAA020002000100',
  medications: {
    cetirizine: {
      medicationId: 'cetirizine',
      name: '세티리진염산염',
      status: 'allowed',
      category: '항히스타민제',
      reason: '시연용 제한 목록에서 비대면 처방 금지 성분으로 분류되지 않았습니다.',
    },
    loratadine: {
      medicationId: 'loratadine',
      name: '로라타딘',
      status: 'allowed',
      category: '항히스타민제',
      reason: '시연용 제한 목록에서 비대면 처방 금지 성분으로 분류되지 않았습니다.',
    },
    prednisolone: {
      medicationId: 'prednisolone',
      name: '프레드니솔론',
      status: 'conditional',
      category: '전신 스테로이드',
      reason: '환자 상태와 과거 투약력을 의사가 추가 확인한 뒤 선택하는 시연 항목입니다.',
    },
    amoxicillin: {
      medicationId: 'amoxicillin',
      name: '아목시실린',
      status: 'conditional',
      category: '항생제',
      reason: '비대면 진료에서 항생제 처방은 필요성을 의사가 별도로 판단해야 합니다.',
    },
    zolpidem: {
      medicationId: 'zolpidem',
      name: '졸피뎀타르타르산염',
      status: 'prohibited',
      category: '향정신성의약품',
      reason: '향정신성의약품으로 비대면 처방이 제한됩니다.',
    },
    isotretinoin: {
      medicationId: 'isotretinoin',
      name: '이소트레티노인',
      status: 'prohibited',
      category: '오남용 우려 의약품',
      reason: '기형 유발 위험으로 대면 확인이 필요한 성분입니다.',
    },
    liraglutide: {
      medicationId: 'liraglutide',
      name: '리라글루티드(삭센다)',
      status: 'prohibited',
      category: '비만치료제',
      reason: '2024-12-02 비대면 처방제한 목록에 추가된 비만치료제입니다.',
    },
    levonorgestrel: {
      medicationId: 'levonorgestrel',
      name: '레보노르게스트렐(사후피임약)',
      status: 'prohibited',
      category: '사후피임약',
      reason: '사후피임약은 비대면 처방이 제한됩니다.',
    },
  },
}
