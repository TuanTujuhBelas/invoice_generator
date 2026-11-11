export class AppError extends Error {
  readonly code: string

  constructor(code: string, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'AppError'
    this.code = code
  }
}

const MAX_ERROR_MESSAGE_LENGTH = 500

export function toErrorCode(error: unknown): string | null {
  if (error === undefined || error === null) return null
  if (error instanceof AppError) return error.code
  return 'INTERNAL_ERROR'
}

export function toSafeMessage(error: unknown): string | null {
  if (error === undefined || error === null) return null
  const message = error instanceof Error ? error.message : String(error)
  return message.slice(0, MAX_ERROR_MESSAGE_LENGTH)
}

export function toStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined
}
