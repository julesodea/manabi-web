"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { getAdjacentIds } from "@/lib/navigationList";

interface UseNavigationListResult {
  currentId: string;
  prevId: string | null;
  nextId: string | null;
  goToPrev: () => void;
  goToNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function useNavigationList(
  resourceKey: string,
  initialId: string
): UseNavigationListResult {
  const [currentId, setCurrentId] = useState(initialId);

  // Sync if the route-level id changes (e.g. direct URL navigation)
  useEffect(() => {
    setCurrentId(initialId);
  }, [initialId]);

  const adjacent = useMemo(
    () => getAdjacentIds(resourceKey, currentId),
    [resourceKey, currentId]
  );

  const navigateTo = useCallback(
    (id: string) => {
      if (!adjacent.basePath) return;
      setCurrentId(id);
      window.history.pushState(null, "", `${adjacent.basePath}/${id}`);
    },
    [adjacent.basePath]
  );

  const goToPrev = useCallback(() => {
    if (adjacent.prevId) navigateTo(adjacent.prevId);
  }, [adjacent.prevId, navigateTo]);

  const goToNext = useCallback(() => {
    if (adjacent.nextId) navigateTo(adjacent.nextId);
  }, [adjacent.nextId, navigateTo]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (adjacent.prevId) navigateTo(adjacent.prevId);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (adjacent.nextId) navigateTo(adjacent.nextId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [adjacent, navigateTo]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const pathParts = window.location.pathname.split("/");
      const urlId = pathParts[pathParts.length - 1];
      if (urlId && urlId !== currentId) {
        setCurrentId(urlId);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentId]);

  return {
    currentId,
    prevId: adjacent.prevId,
    nextId: adjacent.nextId,
    goToPrev,
    goToNext,
    hasPrev: !!adjacent.prevId,
    hasNext: !!adjacent.nextId,
  };
}
