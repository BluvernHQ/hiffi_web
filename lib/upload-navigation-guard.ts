export type UploadNavigationGuardResult = {
  shouldBlock: boolean
  message: string
}

type GuardFn = () => UploadNavigationGuardResult

let guard: GuardFn | null = null

/** Register while the upload page has a draft worth protecting. */
export function registerUploadNavigationGuard(fn: GuardFn | null) {
  guard = fn
}

export function checkUploadNavigationGuard(): UploadNavigationGuardResult {
  if (!guard) {
    return { shouldBlock: false, message: "" }
  }
  return guard()
}
