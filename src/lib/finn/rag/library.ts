import { del, get, set } from "idb-keyval";
import { useCallback, useEffect, useState } from "react";
import { chunkPages } from "./chunk";
import { extractFile } from "./extract";
import type { Chunk, DocKind, DocMeta } from "./types";

/** Local document library (IndexedDB). Documents never leave the device except as retrieved passages sent for analysis. */
const docsKey = (ticker: string) => `finn.docs.${ticker}`;
const chunksKey = (docId: string) => `finn.chunks.${docId}`;

export async function listDocs(ticker: string): Promise<DocMeta[]> {
  return (await get<DocMeta[]>(docsKey(ticker))) ?? [];
}

export async function loadChunks(docs: DocMeta[]): Promise<Chunk[]> {
  const all = await Promise.all(docs.map((d) => get<Chunk[]>(chunksKey(d.id))));
  return all.flatMap((c) => c ?? []);
}

export async function ingest(
  ticker: string,
  file: File,
  meta: { kind: DocKind; period: string; url?: string },
  onProgress?: (msg: string) => void,
): Promise<DocMeta> {
  onProgress?.("Extracting text…");
  const pages = await extractFile(file, (d, t) => onProgress?.(`Extracting page ${d}/${t}…`));
  const textChars = pages.reduce((s, p) => s + p.text.trim().length, 0);
  if (textChars < 200) throw new Error("No extractable text found. Scanned PDFs need OCR before upload.");
  const id = "d" + Date.now().toString(36);
  onProgress?.("Chunking…");
  const chunks = chunkPages(id, pages);
  const doc: DocMeta = { id, ticker, name: file.name, kind: meta.kind, period: meta.period.trim() || "Not stated", url: meta.url?.trim() || undefined, pages: pages.length, chunks: chunks.length, uploadedAt: new Date().toISOString() };
  await set(chunksKey(id), chunks);
  await set(docsKey(ticker), [...(await listDocs(ticker)), doc]);
  return doc;
}

export async function removeDoc(ticker: string, id: string) {
  await del(chunksKey(id));
  await set(docsKey(ticker), (await listDocs(ticker)).filter((d) => d.id !== id));
}

export function useLibrary(ticker: string) {
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const d = await listDocs(ticker);
      setDocs(d);
      setChunks(await loadChunks(d));
    } finally {
      setLoading(false);
    }
  }, [ticker]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { docs, chunks, loading, refresh };
}
