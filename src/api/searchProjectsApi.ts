import type { Territory } from "../types/dashboard";

export interface SearchProjectsParams {
  query: string;
  territories: Territory[];
}

export interface SearchProjectsResult {
  matches: number;
  ancestors: string[];
}

const FAKE_LATENCY_MS = 400;

function findExactMatches(
  territories: Territory[],
  q: string
): SearchProjectsResult {
  const ancestorSet = new Set<string>();
  let matches = 0;

  for (const t of territories) {
    for (const g of t.aptrBudgetGosbs) {
      for (const o of g.aptrBudgetObjects) {
        for (const p of o.aptrProjects) {
          const number = (p.number ?? "").trim().toLowerCase();
          const address = (p.address ?? "").trim().toLowerCase();
          if (number === q || address === q) {
            matches += 1;
            ancestorSet.add(t.id);
            ancestorSet.add(g.id);
            ancestorSet.add(o.id);
          }
        }
      }
    }
  }

  return { matches, ancestors: Array.from(ancestorSet) };
}

export async function searchProjects(
  { query, territories }: SearchProjectsParams,
  signal?: AbortSignal
): Promise<SearchProjectsResult> {
  await new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(resolve, FAKE_LATENCY_MS);
    signal?.addEventListener("abort", () => {
      window.clearTimeout(timeoutId);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

  const q = query.trim().toLowerCase();
  if (!q) {
    return { matches: 0, ancestors: [] };
  }

  return findExactMatches(territories, q);
}
