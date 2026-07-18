type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[]
}

/** Avoid `</script>` breaking out of inline JSON-LD when user/API content includes `<`. */
function safeJsonLdStringify(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(data) }}
    />
  )
}
