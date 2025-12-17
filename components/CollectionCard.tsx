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
      className="block border rounded-lg p-6 hover:shadow-lg transition-shadow duration-200 bg-white"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-semibold text-gray-900">
          {collection.name}
        </h3>
        {collection.metadata.jlptLevel && (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
            {collection.metadata.jlptLevel}
          </span>
        )}
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {collection.description}
      </p>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {collection.characterIds.length} kanji
        </span>

        {progress && progress.total > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-gray-600 font-medium">
              {progressPercentage}%
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <span className="text-xs text-gray-700">
          Study mode:{" "}
          {collection.studyMode === "flashcard"
            ? "Flashcard"
            : "Multiple Choice"}
        </span>
      </div>
    </Link>
  );
}
