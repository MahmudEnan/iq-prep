
const fs = require("node:fs/promises");

const FEEDS = [
  "https://news.google.com/rss/search?q=Bangladesh+current+affairs&hl=en-US&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=Bangladesh+news&hl=en-US&gl=US&ceid=US:en",
];

const OUTPUT = "current-affairs.json";

function clean(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) =>
      String.fromCodePoint(Number(n))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16))
    )
    .replace(/\s+/g, " ")
    .trim();
}

function tag(xml, name) {
  const match = xml.match(
    new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i")
  );
  return match ? clean(match[1]) : "";
}

async function main() {
  const articles = [];

  for (const feed of FEEDS) {
    try {
      const response = await fetch(feed, {
        headers: { "User-Agent": "IQ-Prep-NewsBot/1.0" },
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const xml = await response.text();
      const items = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) || [];

      for (const item of items) {
        const title = tag(item, "title");
        const link = tag(item, "link");
        const published = tag(item, "pubDate");
        const description = tag(item, "description");

        if (!title || !link || !/^https?:\/\//i.test(link)) continue;

        articles.push({
          title,
          link,
          publishedAt: published,
          description,
          category: "Current Affairs",
        });
      }

      console.log(`Feed processed: ${feed}`);
    } catch (error) {
      console.error(`Feed failed: ${feed} — ${error.message}`);
    }
  }

  const unique = [
    ...new Map(articles.map(a => [a.link, a])).values(),
  ].sort((a, b) => {
    const da = Date.parse(a.publishedAt) || 0;
    const db = Date.parse(b.publishedAt) || 0;
    return db - da;
  });

  if (!unique.length) {
    throw new Error("No articles fetched; existing JSON preserved.");
  }

  const data = {
    updatedAt: new Date().toISOString(),
    source: "RSS",
    articles: unique.slice(0, 100),
  };

  await fs.writeFile(OUTPUT, JSON.stringify(data, null, 2) + "\n");
  console.log(`Saved ${data.articles.length} articles to ${OUTPUT}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
