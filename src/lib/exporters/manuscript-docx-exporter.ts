import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import type { Manuscript } from "@/lib/schemas";

export async function exportManuscriptToDocx(manuscript: Manuscript) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: manuscript.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          // Authors
          ...(manuscript.authors.length > 0
            ? [new Paragraph({
                children: [new TextRun({
                  text: manuscript.authors.map((a) => a.name).join(", "),
                  italics: true,
                  color: "555555",
                })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              })]
            : []),
          // Abstract
          ...(manuscript.abstract
            ? [
                new Paragraph({ text: "Abstract", heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }),
                new Paragraph({ children: [new TextRun(manuscript.abstract)], spacing: { after: 240 } }),
              ]
            : []),
          // Keywords
          ...(manuscript.keywords.length > 0
            ? [new Paragraph({
                children: [
                  new TextRun({ text: "Keywords: ", bold: true }),
                  new TextRun(manuscript.keywords.join(", ")),
                ],
                spacing: { after: 360 },
              })]
            : []),
          ...manuscript.blocks.flatMap((block) => {
            const paragraphs: Paragraph[] = [];

            if (block.type === "divider") {
              paragraphs.push(new Paragraph({ text: "", spacing: { before: 240, after: 240 } }));
            } else if (block.type.startsWith("h")) {
              const levelMap: Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
                h1: HeadingLevel.HEADING_1,
                h2: HeadingLevel.HEADING_2,
                h3: HeadingLevel.HEADING_3,
              };
              const level = levelMap[block.type] ?? HeadingLevel.HEADING_1;
              
              paragraphs.push(
                new Paragraph({
                  text: block.content,
                  heading: level,
                  spacing: { before: 240, after: 120 },
                })
              );
            } else if (block.type === "quote") {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: block.content,
                      italics: true,
                      color: "666666",
                    }),
                  ],
                  indent: { left: 720 },
                  spacing: { before: 120, after: 120 },
                })
              );
            } else if (block.type === "code") {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: block.content,
                      font: "Courier New",
                      size: 20,
                    }),
                  ],
                  spacing: { before: 120, after: 120 },
                })
              );
            } else if (block.type === "math") {
              paragraphs.push(
                new Paragraph({
                  children: [new TextRun({ text: `[Equation] ${block.content}`, italics: true })],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 240, after: 240 },
                })
              );
            } else if (block.type === "figure") {
              paragraphs.push(
                new Paragraph({
                  children: [new TextRun({ text: `[Figure: ${block.content}]`, color: "555555" })],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 120, after: 60 },
                })
              );
              if (block.meta?.caption) {
                paragraphs.push(
                  new Paragraph({
                    children: [new TextRun({ text: block.meta.caption as string, italics: true, size: 20 })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 240 },
                  })
                );
              }
            } else {
              const lines = block.content.split("\n");
              lines.forEach((line) => {
                paragraphs.push(
                  new Paragraph({
                    children: [new TextRun(line)],
                    spacing: { after: 120 },
                  })
                );
              });
            }
            
            return paragraphs;
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${manuscript.title.replace(/[^a-z0-9а-яіїє]/gi, "_")}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
