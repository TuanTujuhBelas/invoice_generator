// Single-tenant for MVP: every row is scoped to this organization (blueprint 4.2 #5).
export const ORG_ID = '01a1cbca-9956-7636-a194-ce8248b23f7e'

export const DEFAULT_CURRENCY = 'IDR'
export const DEFAULT_TAX_RATE_BP = 1200
export const DEFAULT_DPP_NUM = 11
export const DEFAULT_DPP_DEN = 12
export const BUSINESS_TIME_ZONE = 'Asia/Makassar'

/** Actor used by `next dev`, where Cloudflare Access is not in front of the app. */
export const DEV_USER_EMAIL = 'dev@localhost'
