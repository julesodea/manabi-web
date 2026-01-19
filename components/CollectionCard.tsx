import Link from "next/link";
import { Collection } from "@/types";

interface CollectionCardProps {
  collection: Collection;
  progress?: {
    learned: number;
    total: number;
  };
}

export function CollectionCard({ collection, progress }: CollectionCardProps) {
  const progressPercentage = progress
    ? Math.round((progress.learned / progress.total) * 100)
    : 0;

  return (
    <Link
      href={`/study/${collection.id}`}
      className="block border-b border-border py-6 hover:bg-card-bg transition-colors"
    >
      <div className="flex items-center gap-4">
        {/* Icon/Initial */}
        <div className="w-12 h-12 rounded-lg bg-card-bg flex items-center justify-center shrink-0">
          <span className="text-2xl font-semibold text-foreground">
            {collection.name.charAt(0)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">
              {collection.name}
            </h3>
            {collection.metadata.jlptLevel && (
              <span className="text-xs px-2 py-0.5 rounded bg-card-bg text-muted shrink-0">
                {collection.metadata.jlptLevel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span>{collection.characterIds.length} kanji</span>
            <span>•</span>
            <span>
              {collection.studyMode === "flashcard"
                ? "Flashcard"
                : "Multiple Choice"}
            </span>
          </div>
        </div>

        {/* Progress Indicator */}
        {progress && progress.total > 0 ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted">{progressPercentage}%</span>
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--accent)" }}
            />
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-border shrink-0" />
        )}
      </div>
    </Link>
  );
}
