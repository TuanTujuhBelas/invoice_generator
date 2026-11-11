// Blueprint 8.5: never log tokens, cookies, full email bodies, files, or signed URLs.

export const REDACTED = '[REDACTED]'

const SENSITIVE_KEY_PATTERN =
  /token|cookie|password|secret|authorization|api[-_]?key|signed[-_]?url|presigned|html|body|attachment|file[-_]?(content|data|bytes)/i
const MAX_DEPTH = 5
const MAX_STRING_LENGTH = 1000

export function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return REDACTED
  if (typeof value === 'string') return value.slice(0, MAX_STRING_LENGTH)
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value) || value instanceof Blob) {
    return REDACTED
  }
  if (Array.isArray(value)) return value.map((entry) => redact(entry, depth + 1))
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redact(entry, depth + 1),
      ]),
    )
  }
  return value
}
