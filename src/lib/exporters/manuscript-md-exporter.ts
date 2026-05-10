import type { Manuscript } from "@/lib/schemas";

export function exportManuscriptToMd(manuscript: Manuscript) {
  let md = `# ${manuscript.title}\n\n`;

  manuscript.blocks.forEach((block) => {
    if (block.type === "h1") md += `## ${block.content}\n\n`;
    else if (block.type === "h2") md += `### ${block.content}\n\n`;
    else if (block.type === "h3") md += `#### ${block.content}\n\n`;
    else if (block.type === "quote") md += `> ${block.content}\n\n`;
    else if (block.type === "code") md += `\`\`\`\n${block.content}\n\`\`\`\n\n`;
    else if (block.type === "math") md += `$$\n${block.content}\n$$\n\n`;
    else if (block.type === "figure") md += `![${block.meta?.caption ?? "Figure"}](${block.content})\n\n`;
    else if (block.type === "table") md += `${block.content}\n\n`;
    else md += `${block.content}\n\n`;
  });

  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${manuscript.title.replace(/[^a-z0-9а-яіїє]/gi, "_")}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
