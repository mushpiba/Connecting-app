import type { ClassifierInput, ModelVerdict } from '../domain/classifier'
import { supabase } from './supabaseClient'

/** 이만큼 기다려도 안 오면 규칙으로 간다. 분류가 늦다고 글을 못 올리면 안 된다. */
const TIMEOUT_MS = 4000

/**
 * 증상 글을 Edge Function 으로 보내 진료과 후보를 받는다.
 *
 * 여기서 Anthropic 을 직접 부르지 않는다. 그러려면 API 키가 브라우저에 있어야
 * 하고, 브라우저에 내려간 값은 공개된 값이다. 함수가 대신 부른다.
 *
 * 환자가 쓴 증상 글이 우리 서버를 지나 모델 제공자에게 간다. 이건 화면에서
 * 밝혀야 하는 사실이지 구현 세부가 아니다.
 */
export async function classifyWithModel(input: ClassifierInput): Promise<ModelVerdict[]> {
  if (!supabase) throw new Error('offline')

  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS)

  try {
    const { data, error } = await supabase.functions.invoke('classify-symptoms', {
      body: { text: input.text },
    })

    if (error) throw error
    return Array.isArray(data) ? (data as ModelVerdict[]) : []
  } finally {
    clearTimeout(timer)
  }
}
