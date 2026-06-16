/** Autocapture noise from report dialog chrome (not primary user actions). */
const REPORT_DIALOG_NOISE_PREFIX = "report-dialog-"

/** Flag/report entry points — one batched click per press. */
const REPORT_OPEN_UI_NAMES = new Set([
  "report-video",
  "report-comment",
  "report-profile",
])

const CLICK_DEDUPE_MS = 500

type CaptureFn = (eventName: string, props?: Record<string, unknown>) => void

function clickDedupeKey(props?: Record<string, unknown>): string {
  const uiName = String(props?.element_ui_name ?? "").trim()
  if (uiName) return `ui:${uiName}`

  const path = String(props?.path ?? props?.url ?? "").trim()
  const tag = String(props?.element_tag ?? "").trim()
  const id = String(props?.element_id ?? "").trim()
  const text = String(props?.element_text ?? "")
    .trim()
    .slice(0, 40)
  return `raw:${path}|${tag}|${id}|${text}`
}

/**
 * Wrap HifiAnalytics.capture so each physical click produces at most one batched $click
 * within a short window, and report-dialog form chrome is not ingested.
 */
export function installCaptureDeduper(capture: CaptureFn): CaptureFn {
  const lastClickAt = new Map<string, number>()
  let lastReportOpenPath = ""
  let lastReportOpenAt = 0

  return (eventName: string, props?: Record<string, unknown>) => {
    if (eventName === "$click") {
      const uiName = String(props?.element_ui_name ?? "").trim().toLowerCase()
      if (uiName.startsWith(REPORT_DIALOG_NOISE_PREFIX)) return

      const path = String(props?.path ?? "").trim()
      const now = Date.now()

      // Collapse ghost unnamed clicks that follow a report flag press on the same page.
      if (
        path &&
        path === lastReportOpenPath &&
        now - lastReportOpenAt < CLICK_DEDUPE_MS &&
        (!uiName || !REPORT_OPEN_UI_NAMES.has(uiName))
      ) {
        const tag = String(props?.element_tag ?? "").trim().toLowerCase()
        if (tag === "button" || tag === "svg" || tag === "a") return
      }

      const key = clickDedupeKey(props)
      const prev = lastClickAt.get(key) ?? 0
      if (now - prev < CLICK_DEDUPE_MS) return
      lastClickAt.set(key, now)

      if (uiName && REPORT_OPEN_UI_NAMES.has(uiName)) {
        lastReportOpenPath = path
        lastReportOpenAt = now
      }
    }

    capture(eventName, props)
  }
}
