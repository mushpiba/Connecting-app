import { demoClinics } from '../data/demoClinics'
import { demoDoctors } from '../data/demoDoctors'
import { demoPatients } from '../data/demoQuestions'
import { useCommunity } from './CommunityContext'
import type { Clinic, Doctor, Patient } from '../domain/types'

export interface Directory {
  doctors: Doctor[]
  clinics: Clinic[]
  patients: Patient[]
  findDoctor: (id: string) => Doctor | undefined
  findClinic: (id: string) => Clinic | undefined
  findPatient: (id: string) => Patient | undefined
}

/**
 * 사람과 의료기관을 찾는 한 자리.
 *
 * 라이브에서는 계정 id가 uuid라 픽스처 id로 찾으면 빗나간다. 서버에서 읽은
 * 것이 있으면 그것을 먼저 쓰고, 없으면 데모 픽스처로 떨어진다. 화면은 어느
 * 쪽인지 몰라도 된다.
 */
export function useDirectory(): Directory {
  const { live } = useCommunity()

  const doctors = live?.doctors.length ? live.doctors : demoDoctors
  const clinics = live?.clinics.length ? live.clinics : demoClinics
  const patients = live?.patients.length ? live.patients : demoPatients

  return {
    doctors,
    clinics,
    patients,
    findDoctor: (id) => doctors.find((item) => item.id === id) ?? demoDoctors.find((item) => item.id === id),
    findClinic: (id) => clinics.find((item) => item.id === id) ?? demoClinics.find((item) => item.id === id),
    findPatient: (id) => patients.find((item) => item.id === id) ?? demoPatients.find((item) => item.id === id),
  }
}
