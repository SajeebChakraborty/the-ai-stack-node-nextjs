import { NextResponse } from "next/server";
import { news, tools } from "@/data/catalog";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const items = [
    ...news.map((article) => ({
      title: article.title,
      link: `${baseUrl}/news/${article.slug}`,
      description: article.excerpt,
      pubDate: new Date(article.publishedAt).toUTCString()
    })),
    ...tools.map((tool) => ({
      title: `${tool.name} launched on TheAiStack`,
      link: `${baseUrl}/tools/${tool.slug}`,
      description: tool.tagline,
      pubDate: new Date(tool.launchedAt).toUTCString()
    }))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>TheAiStack</title>
    <link>${baseUrl}</link>
    <description>AI launches, reviews, rankings, and market intelligence.</description>
    ${items
      .map(
        (item) => `<item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8"
    }
  });
}
