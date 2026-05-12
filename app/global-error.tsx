"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[global-error-boundary]", error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            fontFamily: "system-ui, sans-serif",
            background: "#fafafa",
            color: "#111827",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              background: "#ffffff",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <h2 style={{ margin: "0 0 8px", fontSize: "24px" }}>Unexpected application error</h2>
            <p style={{ margin: "0 0 16px", color: "#6b7280", fontSize: "14px" }}>
              Please refresh or try again. If the issue continues, contact support.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  border: "1px solid #111827",
                  background: "#ffffff",
                  color: "#111827",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Reload page
              </button>
              <button
                type="button"
                onClick={reset}
                style={{
                  border: "1px solid #111827",
                  background: "#111827",
                  color: "#ffffff",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
