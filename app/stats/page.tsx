"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useCollections } from "@/lib/hooks/useCollections";
import { KanjiDetailModal } from "@/components/ui/KanjiDetailModal";
import MinimalHeader from "@/components/MinimalHeader";
import MenuDrawer from "@/components/MenuDrawer";

interface SessionResultItem {
  characterId: string;
  character: string;
  meaning: string;
  correct: boolean;
}

interface StudySession {
  id: string;
  collectionId: string;
  startTime: number;
  endTime: number;
  reviewedCount: number;
  correctCount: number;
  incorrectCount: number;
  results?: SessionResultItem[];
}

interface UserStats {
  study_streak: number;
  total_reviews: number;
  characters_learned: number;
  total_study_time: number;
}

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: collections = [] } = useCollections(true);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [selectedKanjiId, setSelectedKanjiId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  // Fetch sessions and stats
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [sessionsRes, statsRes] = await Promise.all([
          fetch('/api/learning/sessions?limit=100'),
          fetch('/api/learning/stats'),
        ]);

        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setSessions(data.sessions || []);
        }

        if (statsRes.ok) {
          const data = await statsRes.json();
          setUserStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Generate calendar heatmap data (13 weeks ending today)
  const calendarData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: { date: Date; count: number; sessions: StudySession[] }[] = [];

    // 13 weeks = 91 days, ending today
    for (let i = 90; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const dayStart = date.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const daySessions = sessions.filter(
        (s) => s.endTime >= dayStart && s.endTime < dayEnd
      );

      days.push({
        date,
        count: daySessions.length,
        sessions: daySessions,
      });
    }

    return days;
  }, [sessions]);

  // Get max count for color scaling
  const maxCount = useMemo(() => {
    return Math.max(1, ...calendarData.map((d) => d.count));
  }, [calendarData]);

  // Get collection name by ID
  const getCollectionName = (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    return collection?.name || "Unknown Collection";
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Format duration
  const formatDuration = (startTime: number, endTime: number) => {
    const seconds = Math.floor((endTime - startTime) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-6xl text-foreground animate-pulse">学</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card-bg rounded-xl p-8 shadow-sm border border-border max-w-md mx-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Sign in to view your stats
          </h2>
          <p className="text-muted mb-6">
            Track your progress and see your study history.
          </p>
          <Link
            href="/login"
            className="px-6 py-3 bg-[var(--accent)] text-[var(--accent-text)] rounded-full font-semibold shadow-md inline-block hover:shadow-lg transition-shadow"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-0">
      {/* Menu Drawer */}
      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Minimal Header */}
      <MinimalHeader
        showMenu
        onMenuClick={() => setMenuOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">Your Stats</h1>

        {loading ? (
          <div className="space-y-6">
            <div className="bg-card-bg rounded-xl p-6 shadow-sm border border-border animate-pulse">
              <div className="h-6 w-32 bg-border rounded mb-4"></div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-background rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="bg-card-bg rounded-xl p-6 shadow-sm border border-border mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-background rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[var(--accent)] mb-1">
                    {userStats?.study_streak ?? 0}
                  </div>
                  <div className="text-sm text-muted">Sessions Completed</div>
                </div>
                <div className="bg-background rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[var(--accent)] mb-1">
                    {userStats?.total_reviews ?? 0}
                  </div>
                  <div className="text-sm text-muted">Total Reviews</div>
                </div>
                <div className="bg-background rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[var(--accent)] mb-1">
                    {userStats?.characters_learned ?? 0}
                  </div>
                  <div className="text-sm text-muted">Kanji Learned</div>
                </div>
                <div className="bg-background rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[var(--accent)] mb-1">
                    {sessions.length > 0
                      ? Math.round(
                          (sessions.reduce((acc, s) => acc + s.correctCount, 0) /
                            sessions.reduce(
                              (acc, s) => acc + s.reviewedCount,
                              0
                            )) *
                            100
                        ) || 0
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-muted">Avg Accuracy</div>
                </div>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-card-bg rounded-xl p-6 shadow-sm border border-border mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Recent Sessions
              </h2>
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <p>No study sessions yet.</p>
                  <Link
                    href="/"
                    className="mt-4 inline-block px-6 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-full font-medium shadow-md hover:shadow-lg transition-shadow"
                  >
                    Start Studying
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 20).map((session) => {
                    const accuracy =
                      session.reviewedCount > 0
                        ? Math.round(
                            (session.correctCount / session.reviewedCount) * 100
                          )
                        : 0;
                    const isExpanded = expandedSessions.has(session.id);
                    const hasResults = session.results && session.results.length > 0;
                    const correctResults = session.results?.filter(r => r.correct) || [];
                    const incorrectResults = session.results?.filter(r => !r.correct) || [];

                    return (
                      <div
                        key={session.id}
                        className="bg-background rounded-xl overflow-hidden border border-border"
                      >
                        <button
                          onClick={() => toggleSession(session.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-card-bg transition-colors text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {getCollectionName(session.collectionId)}
                            </div>
                            <div className="text-sm text-muted">
                              {formatDate(session.endTime)} •{" "}
                              {formatDuration(session.startTime, session.endTime)}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 ml-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-foreground">
                                {session.reviewedCount} cards
                              </div>
                              <div className="text-xs text-muted">
                                {session.correctCount} correct
                              </div>
                            </div>
                            <div
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                accuracy >= 80
                                  ? "bg-green-100 text-green-700"
                                  : accuracy >= 60
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {accuracy}%
                            </div>
                            <svg
                              className={`w-5 h-5 text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-border">
                            {hasResults ? (
                              <div className="pt-4 space-y-4">
                                {correctResults.length > 0 && (
                                  <div>
                                    <div className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Correct ({correctResults.length})
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {correctResults.map((result) => (
                                        <button
                                          key={result.characterId}
                                          onClick={() => setSelectedKanjiId(result.characterId)}
                                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-colors cursor-pointer"
                                        >
                                          <span className="text-lg font-medium text-foreground">{result.character}</span>
                                          <span className="text-sm text-muted">{result.meaning}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {incorrectResults.length > 0 && (
                                  <div>
                                    <div className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      Incorrect ({incorrectResults.length})
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {incorrectResults.map((result) => (
                                        <button
                                          key={result.characterId}
                                          onClick={() => setSelectedKanjiId(result.characterId)}
                                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer"
                                        >
                                          <span className="text-lg font-medium text-foreground">{result.character}</span>
                                          <span className="text-sm text-muted">{result.meaning}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="pt-4 text-sm text-muted text-center">
                                No detailed results available for this session.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Calendar Heatmap */}
            <div className="bg-card-bg rounded-xl p-6 shadow-sm border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Activity
              </h2>
              <div className="flex gap-1">
                {Array.from({ length: 13 }, (_, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-1 flex-1">
                    {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                      const dayIdx = weekIdx * 7 + dayOfWeek;
                      const day = calendarData[dayIdx];
                      if (!day) return <div key={dayOfWeek} className="aspect-square rounded-sm bg-transparent" />;

                      const intensity =
                        day.count === 0
                          ? 0
                          : Math.min(4, Math.ceil((day.count / maxCount) * 4));
                      const bgColors = [
                        "bg-border",
                        "bg-green-200",
                        "bg-green-300",
                        "bg-green-400",
                        "bg-green-500",
                      ];

                      return (
                        <div
                          key={dayOfWeek}
                          className={`aspect-square rounded-sm ${bgColors[intensity]}`}
                          title={`${day.date.toLocaleDateString()}: ${day.count} session${day.count !== 1 ? "s" : ""}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-border rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                </div>
                <span>More</span>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Kanji Detail Modal */}
      <KanjiDetailModal
        isOpen={selectedKanjiId !== null}
        onClose={() => setSelectedKanjiId(null)}
        kanjiId={selectedKanjiId || ""}
      />
    </div>
  );
}
