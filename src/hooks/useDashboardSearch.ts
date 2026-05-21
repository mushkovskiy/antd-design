import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Territory } from "../types/dashboard";
import { searchProjects } from "../api/searchProjectsApi";

interface UseDashboardSearchParams {
  query: string;
  territories: Territory[];
  onMatchExpand: (ancestorKeys: string[]) => void;
}

interface UseDashboardSearchResult {
  isSearching: boolean;
  matchesCount: number | null;
}

const DEBOUNCE_MS = 300;

export function useDashboardSearch({
  query,
  territories,
  onMatchExpand,
}: UseDashboardSearchParams): UseDashboardSearchResult {
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setDebouncedQuery("");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(trimmed.toLowerCase());
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const enabled = debouncedQuery.length > 0;

  const { data, isFetching } = useQuery({
    queryKey: ["dashboard-search", debouncedQuery],
    queryFn: ({ signal }) =>
      searchProjects({ query: debouncedQuery, territories }, signal),
    enabled,
    retry: false,
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data && data.ancestors.length > 0) {
      onMatchExpand(data.ancestors);
    }
  }, [data, onMatchExpand]);

  return {
    isSearching: isFetching,
    matchesCount: enabled ? data?.matches ?? null : null,
  };
}
