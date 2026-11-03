<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- FINN domain logic lives in `src/lib/finn/` (types, data adapters, scoring, alerts, store); UI in `src/components/finn/`, pages in `src/routes/` — keep logic out of components so data adapters can be swapped for live/Cloud sources.
- All seeded data is synthetic and must stay labelled as demo; never present it as live or as real filings.
- State persists to localStorage via `src/lib/finn/store.ts` until a backend adapter replaces it.
- tsconfig keeps exactOptionalPropertyTypes, noUncheckedIndexedAccess, noPropertyAccessFromIndexSignature and noImplicitReturns off — they produced hundreds of low-value errors across UI code.
- Grounded research lives in `src/lib/finn/rag/`: extraction/chunking/BM25 retrieval/metric extraction run in the browser (documents in IndexedDB); the server function only explains retrieved passages via the AI Gateway. Every LLM claim passes `grounding.ts` (valid citation ids + numbers present in cited text or deterministic calcs) — never bypass it, and never let the model compute figures.
