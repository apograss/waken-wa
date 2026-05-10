'use client'

import type {
  AdminSkillsData,
  DevicesResponse,
  PaginationResponse,
  SuccessResponse,
} from '@/types/admin-query'

async function readJson<T>(res: Response): Promise<T | null> {
  return res.json().catch(() => null)
}

export type {
  AdminSkillsData,
  DevicesResponse,
  PaginationResponse,
  SuccessResponse,
}
export { readJson }
