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
      className="block bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-[#5B7FFF] to-[#4A6FEE] flex items-center justify-center p-6 relative">
        {collection.metadata.jlptLevel && (
          <div className="absolute top-4 left-4 bg-white text-[#5B7FFF] px-3 py-1.5 rounded-xl text-xs font-bold shadow-md">
            {collection.metadata.jlptLevel}
          </div>
        )}
        <span className="text-6xl font-bold text-white/90 drop-shadow-lg">
          {collection.name.charAt(0)}
        </span>
      </div>
      
      <div className="p-5 space-y-2">
        <h3 className="text-lg font-bold text-gray-900">
          {collection.name}
        </h3>
        
        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
          {collection.description}
        </p>

        <div className="flex items-center justify-between pt-2">
          <div className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>{collection.characterIds.length} kanji</span>
          </div>
          
          {progress && progress.total > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5B7FFF] transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 font-medium">
                {progressPercentage}%
              </span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-600">
            {collection.studyMode === "flashcard"
              ? "📇 Flashcard"
              : "✓ Multiple Choice"}
          </span>
          <button className="text-gray-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}
