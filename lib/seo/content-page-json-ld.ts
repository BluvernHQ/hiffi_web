import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"

export function buildContentPageJsonLd(opts: {
  path: string
  title: string
  description: string
  breadcrumbLabel: string
}) {
  const { path, title, description, breadcrumbLabel } = opts
  const pageUrl = absoluteUrl(path)
  const origin = getSiteOrigin()

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: title,
        description,
        inLanguage: "en",
        isPartOf: { "@id": `${origin}/#website` },
        about: { "@id": `${origin}/#organization` },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: origin,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: breadcrumbLabel,
            item: pageUrl,
          },
        ],
      },
    ],
  }
}
