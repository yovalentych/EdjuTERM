import { promises as fs } from "node:fs";
import path from "node:path";

export const knowledgeBaseCategories = [
  "ai-policy",
  "disclosure",
  "citation",
  "ethics",
  "methodology",
  "open-science",
  "grant-writing",
] as const;

export type KnowledgeCategory = (typeof knowledgeBaseCategories)[number];

export type KnowledgeBaseArticle = {
  slug: string;
  title: string;
  summary: string;
  category: KnowledgeCategory;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
  level: "starter" | "applied" | "policy";
  featured?: boolean;
  pinned?: boolean;
  sourceName?: string;
  markdown: string;
};

type Frontmatter = Omit<KnowledgeBaseArticle, "markdown" | "slug">;

const KNOWLEDGE_BASE_DIR = path.join(process.cwd(), "content", "knowledge-base");

export async function listKnowledgeBaseArticles() {
  const fileNames = await fs.readdir(KNOWLEDGE_BASE_DIR);
  const articles = await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith(".md"))
      .map(async (fileName) => {
        const slug = fileName.replace(/\.md$/, "");
        return readKnowledgeBaseArticle(slug);
      }),
  );

  return articles.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getKnowledgeBaseArticleBySlug(slug: string) {
  try {
    return await readKnowledgeBaseArticle(slug);
  } catch {
    return null;
  }
}

async function readKnowledgeBaseArticle(slug: string) {
  const filePath = path.join(KNOWLEDGE_BASE_DIR, `${slug}.md`);
  const raw = await fs.readFile(filePath, "utf8");
  const { frontmatter, markdown } = parseFrontmatter(raw);
  return {
    slug,
    ...frontmatter,
    markdown,
  } satisfies KnowledgeBaseArticle;
}

function parseFrontmatter(raw: string) {
  if (!raw.startsWith("---\n")) {
    throw new Error("Missing frontmatter");
  }

  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) {
    throw new Error("Invalid frontmatter");
  }

  const frontmatterBlock = raw.slice(4, end).trim();
  const markdown = raw.slice(end + 5).trim();
  const values: Record<string, string> = {};

  for (const line of frontmatterBlock.split("\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    values[key] = value;
  }

  const category = values.category as KnowledgeCategory;
  if (!knowledgeBaseCategories.includes(category)) {
    throw new Error(`Unsupported category: ${values.category}`);
  }

  const frontmatter: Frontmatter = {
    title: values.title,
    summary: values.summary,
    category,
    tags: values.tags
      ? values.tags.split(",").map((item) => item.trim()).filter(Boolean)
      : [],
    publishedAt: values.publishedAt,
    updatedAt: values.updatedAt || values.publishedAt,
    readingTimeMinutes: Number(values.readingTimeMinutes || "5"),
    level: (values.level as Frontmatter["level"]) || "starter",
    featured: values.featured === "true",
    pinned: values.pinned === "true",
    sourceName: values.sourceName || "",
  };

  return { frontmatter, markdown };
}

export function extractArticleHeadings(markdown: string) {
  return markdown
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => {
      const title = line.replace(/^##\s+/, "").trim();
      return {
        title,
        id: slugifyHeading(title),
      };
    });
}

export function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-zа-яіїєґ0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}
