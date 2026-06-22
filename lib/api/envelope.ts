export function unwrapSuccessData<T>(raw: unknown): T {
  if (raw !== null && typeof raw === "object") {
    const r = raw as Record<string, unknown>
    if (r.success === true && r.data !== null && typeof r.data === "object") {
      return r.data as T
    }
  }
  return raw as T
}

export function extractApiError(raw: unknown): string | null {
  if (raw !== null && typeof raw === "object") {
    const r = raw as Record<string, unknown>
    if (r.success === false) {
      if (typeof r.error === "string") return r.error
      if (typeof r.message === "string") return r.message
    }
  }
  return null
}

export function assertSuccess<T>(raw: unknown): T {
  const err = extractApiError(raw)
  if (err) throw new Error(err)
  return unwrapSuccessData<T>(raw)
}
