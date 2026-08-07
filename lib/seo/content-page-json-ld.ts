import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"

export function buildContentPageJsonLd(opts: {
  path: string
  title: string
  description: string
  breadcrumbLabel: string
  faqItems?: Array<{ question: string; answer: string }>
}) {
  const { path, title, description, breadcrumbLabel, faqItems } = opts
  const pageUrl = absoluteUrl(path)
  const origin = getSiteOrigin()

  const graph: Record<string, unknown>[] = [
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
      ...(faqItems && faqItems.length > 0
        ? { mainEntity: { "@id": `${pageUrl}#faq` } }
        : {}),
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
  ]

  if (faqItems && faqItems.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      url: pageUrl,
      name: `${title} FAQ`,
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    })
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  }
}
