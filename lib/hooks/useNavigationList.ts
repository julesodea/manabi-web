"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAdjacentIds } from "@/lib/navigationList";

interface UseNavigationListResult {
  prevId: string | null;
  nextId: string | null;
  goToPrev: () => void;
  goToNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function useNavigationList(
  resourceKey: string,
  currentId: string
): UseNavigationListResult {
  const router = useRouter();
  const [adjacent, setAdjacent] = useState<{
    prevId: string | null;
    nextId: string | null;
    basePath: string | null;
  }>({ prevId: null, nextId: null, basePath: null });

  useEffect(() => {
    setAdjacent(getAdjacentIds(resourceKey, currentId));
  }, [resourceKey, currentId]);

  const goToPrev = useCallback(() => {
    if (adjacent.prevId && adjacent.basePath) {
      router.push(`${adjacent.basePath}/${adjacent.prevId}`);
    }
  }, [adjacent.prevId, adjacent.basePath, router]);

  const goToNext = useCallback(() => {
    if (adjacent.nextId && adjacent.basePath) {
      router.push(`${adjacent.basePath}/${adjacent.nextId}`);
    }
  }, [adjacent.nextId, adjacent.basePath, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (adjacent.prevId && adjacent.basePath) {
          router.push(`${adjacent.basePath}/${adjacent.prevId}`);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (adjacent.nextId && adjacent.basePath) {
          router.push(`${adjacent.basePath}/${adjacent.nextId}`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [adjacent, router]);

  return {
    prevId: adjacent.prevId,
    nextId: adjacent.nextId,
    goToPrev,
    goToNext,
    hasPrev: !!adjacent.prevId,
    hasNext: !!adjacent.nextId,
  };
}
