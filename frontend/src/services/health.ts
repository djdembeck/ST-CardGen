import { httpJson } from './http'

export type HealthResponse = { ok: boolean; service: string; ts: string }

export function getHealth() {
  return httpJson<HealthResponse>('/api/health')
}
