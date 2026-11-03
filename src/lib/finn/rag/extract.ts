import type { PageText } from "./types";
import { sectionsFromTranscript } from "./chunk";

/**
 * Browser-side text extraction. PDFs keep their page numbers; plain-text
 * transcripts are split into numbered sections. Runs without any external API.
 */
export async function extractPdf(file: File, onProgress?: (done: number, total: number) => void): Promise<PageText[]> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: PageText[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let text = "";
    let lastY: number | null = null;
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5];
      if (lastY != null && Math.abs(y - lastY) > 2) text += "\n";
      else if (text && !text.endsWith(" ")) text += " ";
      text += item.str;
      lastY = y;
    }
    pages.push({ page: i, text });
    onProgress?.(i, doc.numPages);
  }
  return pages;
}

export async function extractFile(file: File, onProgress?: (done: number, total: number) => void): Promise<PageText[]> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return extractPdf(file, onProgress);
  const raw = await file.text();
  return sectionsFromTranscript(raw);
}
