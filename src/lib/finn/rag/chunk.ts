import type { Chunk, PageText } from "./types";

const TARGET = 1100;
const OVERLAP = 180;

/** Normalise whitespace while keeping paragraph breaks. */
export function clean(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

/**
 * Split each page into overlapping chunks. Chunks never span pages, so every
 * chunk carries exactly one page number for citation.
 */
export function chunkPages(docId: string, pages: PageText[]): Chunk[] {
  const out: Chunk[] = [];
  for (const p of pages) {
    const text = clean(p.text);
    if (text.length < 20) continue;
    let start = 0;
    while (start < text.length) {
      let end = Math.min(text.length, start + TARGET);
      if (end < text.length) {
        // prefer to break on sentence or line boundary
        const window = text.slice(start + TARGET * 0.6, end);
        const br = Math.max(window.lastIndexOf("\n"), window.lastIndexOf(". "));
        if (br > 0) end = start + Math.floor(TARGET * 0.6) + br + 1;
      }
      out.push({ id: `${docId}:${out.length}`, docId, page: p.page, text: text.slice(start, end).trim() });
      if (end >= text.length) break;
      start = Math.max(end - OVERLAP, start + 1);
    }
  }
  return out;
}

/**
 * Transcripts arrive as plain text without pages. Split into numbered sections
 * on speaker turns / blank lines, ~2500 chars each, so citations can say "Section N".
 */
export function sectionsFromTranscript(raw: string): PageText[] {
  const paras = raw.split(/\n\s*\n|\n(?=[A-Z][A-Za-z .'-]{2,40}:)/).map((s) => s.trim()).filter(Boolean);
  const out: PageText[] = [];
  let buf = "";
  for (const p of paras) {
    if (buf.length + p.length > 2500 && buf) {
      out.push({ page: out.length + 1, text: buf });
      buf = "";
    }
    buf += (buf ? "\n" : "") + p;
  }
  if (buf) out.push({ page: out.length + 1, text: buf });
  return out;
}
