
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import Parser from "rss-parser";

const parser = new Parser();
const FILE = "current-affairs.json";
const EXPIRE_MS = 72 * 60 * 60 * 1000;
const MAX_QUESTIONS = Math.min(
  8,
  Math.max(1, Number(process.env.MAX_QUESTIONS_PER_RUN) || 8)
);

const FEEDS = [
  "https://news.google.com/rss/search?q=Bangladesh+current+affairs&hl=en-US&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=Bangladesh+government+economy+science+sports&hl=en-US&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=world+international+current+affairs&hl=en-US&gl=US&ceid=US:en",
];

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function clean(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function validQuestion(q) {
  return Boolean(
    q &&
    typeof q.question === "string" &&
    q.question.trim() &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.options.every(o => typeof o === "string" && o.trim()) &&
    new Set(q.options).size === 4 &&
    Number.isInteger(q.answer) &&
    q.answer >= 0 &&
    q.answer < 4 &&
    typeof q.explanation === "string" &&
    q.explanation.trim() &&
    /^https?:\/\//i.test(q.sourceUrl || "")
  );
}

async function readArticles(now) {
  const collected = [];

  for (const url of FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      console.log(`Read ${feed.items?.length || 0} items from RSS.`);

      for (const item of feed.items || []) {
        const title = clean(item.title);
        const link = item.link || "";
        const snippet = clean(
  item.contentSnippet ||
  item.content ||
  item.summary ||
  item.contentEncoded ||
  item.title ||
  ""
).slice(0, 700);

        if (
          !title ||
          !/^https?:\/\//i.test(link) ||
          snippet.length < 25
        ) {
          continue;
        }

        const publishedAt = item.isoDate || item.pubDate || "";
        const publishedTime = Date.parse(publishedAt);

        if (
          Number.isFinite(publishedTime) &&
          (publishedTime > now + 5 * 60 * 1000 ||
            publishedTime < now - 7 * 24 * 60 * 60 * 1000)
        ) {
          continue;
        }

        collected.push({
          title,
          link,
          snippet,
          publishedAt,
          source:
            typeof item.source === "string"
              ? item.source
              : item.source?.name || feed.title || "Google News RSS",
        });
      }
    } catch (error) {
      console.error(`RSS feed failed: ${error.message}`);
    }
  }

  return [...new Map(collected.map(a => [a.link, a])).values()]
    .sort((a, b) => {
      const da = Date.parse(a.publishedAt) || 0;
      const db = Date.parse(b.publishedAt) || 0;
      return db - da;
    });
}

function makeQuestion(article, articles, now) {
  // Use only real RSS headlines as answer choices.
  const distractors = articles
    .filter(a => a.link !== article.link && a.title !== article.title)
    .sort((a, b) =>
      hash(`${article.link}:${a.link}`).localeCompare(
        hash(`${article.link}:${b.link}`)
      )
    )
    .map(a => a.title)
    .filter((title, index, all) =>
      title.toLowerCase() !== article.title.toLowerCase() &&
      all.findIndex(t => t.toLowerCase() === title.toLowerCase()) === index
    )
    .slice(0, 3);

  if (distractors.length !== 3) return null;

  const options = [article.title, ...distractors].sort((a, b) =>
    hash(`${article.link}:${a}`).localeCompare(
      hash(`${article.link}:${b}`)
    )
  );

  const answer = options.indexOf(article.title);
  const createdAt = new Date(now).toISOString();

  const question = {
    id: `ca-${hash(article.link).slice(0, 20)}`,
    question:
      `According to this news summary, which headline best matches ` +
      `the reported development?\n\nSummary: ${article.snippet}`,
    options,
    answer,
    explanation:
      `The matching headline is taken directly from the linked RSS report. ` +
      `Compare it with the summary and open the source to read the full report.`,
    source: article.source,
    sourceUrl: article.link,
    category: "Current Affairs",
    createdAt,
    verifiedAt: createdAt,
    expiresAt: new Date(now + EXPIRE_MS).toISOString(),
  };

  return validQuestion(question) ? question : null;
}

async function main() {
  const now = Date.now();
  const articles = await readArticles(now);

  if (!articles.length) {
    throw new Error(
      "No usable recent RSS articles found. Existing JSON preserved."
    );
  }

  const oldData = JSON.parse(await fs.readFile(FILE, "utf8"));

  if (!Array.isArray(oldData.questions)) {
    throw new Error(
      "Existing JSON has no questions array; refusing to overwrite."
    );
  }

  const existing = oldData.questions.filter(q => {
    const expiry = Date.parse(q.expiresAt || "");
    return Number.isFinite(expiry) && expiry > now;
  });

  const knownQuestions = new Set(
    existing.map(q => q.question.trim().toLowerCase())
  );
  const knownSources = new Set(
    existing.map(q => q.sourceUrl).filter(Boolean)
  );

  const additions = [];

  for (const article of articles) {
    if (additions.length >= MAX_QUESTIONS) break;
    if (knownSources.has(article.link)) continue;

    const question = makeQuestion(article, articles, now);
    if (!question) continue;

    if (knownQuestions.has(question.question.toLowerCase())) continue;

    additions.push(question);
    knownQuestions.add(question.question.toLowerCase());
    knownSources.add(article.link);
  }

  const questions = [...additions, ...existing].slice(0, 40);

  const output = {
    updatedAt: new Date(now).toISOString(),
    total: questions.length,
    questions,
  };

  const temporary = `${FILE}.tmp`;
  await fs.writeFile(
    temporary,
    JSON.stringify(output, null, 2) + "\n"
  );

  // Verify the output before replacing the existing file.
  const check = JSON.parse(await fs.readFile(temporary, "utf8"));
  if (!Array.isArray(check.questions)) {
    throw new Error("Output validation failed; existing JSON preserved.");
  }

  await fs.rename(temporary, FILE);

  console.log(`New headline quizzes added: ${additions.length}`);
  console.log(`Active questions saved: ${questions.length}`);

  if (!additions.length) {
    console.log("No new eligible headlines; existing active questions retained.");
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
