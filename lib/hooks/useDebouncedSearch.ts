"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useDebouncedSearch(basePath: string) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlSearchQuery = searchParams.get("q") || "";
  const urlLevel = searchParams.get("level") || "All";

  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(urlSearchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      const isJapanese = /[\u3000-\u9FFF\uF900-\uFAFF]/.test(searchQuery);
      const shouldSearch = searchQuery.length === 0 || isJapanese || searchQuery.length >= 2;

      if (!shouldSearch) return;

      const params = new URLSearchParams(searchParams.toString());

      if (searchQuery) {
        params.set("q", searchQuery);
      } else {
        params.delete("q");
      }

      const newUrl = params.toString()
        ? `?${params.toString()}`
        : basePath;
      const currentUrl = searchParams.toString()
        ? `?${searchParams.toString()}`
        : basePath;

      if (newUrl !== currentUrl) {
        router.replace(newUrl, { scroll: false });
      }

      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchParams, router, basePath]);

  return { searchQuery, setSearchQuery, debouncedSearchQuery, urlLevel };
}
