import { LearningProgress } from '@/types';

// SM2 Algorithm implementation for spaced repetition
export class SRSEngine {
  // Base intervals in milliseconds
  private static readonly BASE_INTERVALS = [
    1 * 60 * 1000,        // Level 1: 1 minute
    10 * 60 * 1000,       // Level 2: 10 minutes
    60 * 60 * 1000,       // Level 3: 1 hour
    6 * 60 * 60 * 1000,   // Level 4: 6 hours
    24 * 60 * 60 * 1000,  // Level 5: 1 day
    3 * 24 * 60 * 60 * 1000,  // Level 6: 3 days
    7 * 24 * 60 * 60 * 1000,  // Level 7: 1 week
    14 * 24 * 60 * 60 * 1000, // Level 8: 2 weeks
    30 * 24 * 60 * 60 * 1000, // Level 9: 1 month
    90 * 24 * 60 * 60 * 1000, // Level 10: 3 months
  ];

  static calculateNextReview(
    currentProgress: LearningProgress,
    answerQuality: number, // 0-5 scale (0=wrong, 3=correct with effort, 5=perfect)
    reviewType: 'meaning' | 'reading' | 'writing'
  ): { nextReviewDate: number; newSrsLevel: number } {
    const now = Date.now();
    let newSrsLevel = currentProgress.srsLevel;

    // Adjust SRS level based on answer quality
    if (answerQuality >= 3) {
      // Correct answer - advance to next level
      newSrsLevel = Math.min(newSrsLevel + 1, this.BASE_INTERVALS.length);
    } else if (answerQuality < 3) {
      // Incorrect answer - reduce level
      if (answerQuality === 0) {
        // Completely wrong - reset to level 1
        newSrsLevel = 1;
      } else {
        // Partially wrong - reduce by 1-2 levels
        newSrsLevel = Math.max(1, newSrsLevel - 2);
      }
    }

    // Calculate next review date
    const intervalIndex = Math.max(0, newSrsLevel - 1);
    const baseInterval = this.BASE_INTERVALS[intervalIndex] || this.BASE_INTERVALS[this.BASE_INTERVALS.length - 1];

    // Add some randomization (±10%) to avoid bunching
    const randomFactor = 0.9 + Math.random() * 0.2;
    const interval = Math.floor(baseInterval * randomFactor);

    const nextReviewDate = now + interval;

    return { nextReviewDate, newSrsLevel };
  }

  static initializeProgress(
    userId: string,
    characterId: string
  ): LearningProgress {
    const now = Date.now();

    return {
      userId,
      characterId,
      firstSeen: now,
      lastReviewed: now,
      correctCount: 0,
      incorrectCount: 0,
      srsLevel: 1,
      nextReviewDate: now + this.BASE_INTERVALS[0], // First review in 1 minute
      studyStats: {
        writingAccuracy: 0,
        readingAccuracy: 0,
        meaningAccuracy: 0,
      },
    };
  }

  static updateProgress(
    currentProgress: LearningProgress,
    correct: boolean,
    reviewType: 'meaning' | 'reading' | 'writing'
  ): LearningProgress {
    const now = Date.now();
    const answerQuality = correct ? 4 : 0; // Simplified quality scale

    const { nextReviewDate, newSrsLevel } = this.calculateNextReview(
      currentProgress,
      answerQuality,
      reviewType
    );

    // Update accuracy stats
    const newStats = { ...currentProgress.studyStats };
    const totalReviews = currentProgress.correctCount + currentProgress.incorrectCount + 1;

    switch (reviewType) {
      case 'meaning':
        newStats.meaningAccuracy = ((newStats.meaningAccuracy * (totalReviews - 1)) + (correct ? 1 : 0)) / totalReviews;
        break;
      case 'reading':
        newStats.readingAccuracy = ((newStats.readingAccuracy * (totalReviews - 1)) + (correct ? 1 : 0)) / totalReviews;
        break;
      case 'writing':
        newStats.writingAccuracy = ((newStats.writingAccuracy * (totalReviews - 1)) + (correct ? 1 : 0)) / totalReviews;
        break;
    }

    return {
      ...currentProgress,
      lastReviewed: now,
      correctCount: correct ? currentProgress.correctCount + 1 : currentProgress.correctCount,
      incorrectCount: correct ? currentProgress.incorrectCount : currentProgress.incorrectCount + 1,
      srsLevel: newSrsLevel,
      nextReviewDate,
      studyStats: newStats,
    };
  }

  static isReviewDue(progress: LearningProgress): boolean {
    return progress.nextReviewDate <= Date.now();
  }

  static getDaysBetweenReviews(srsLevel: number): number {
    if (srsLevel <= 0) return 0;

    const intervalIndex = Math.max(0, srsLevel - 1);
    const interval = this.BASE_INTERVALS[intervalIndex] || this.BASE_INTERVALS[this.BASE_INTERVALS.length - 1];

    return Math.floor(interval / (24 * 60 * 60 * 1000));
  }

  static getLevelName(srsLevel: number): string {
    const levels = [
      'Novice',
      'Apprentice I',
      'Apprentice II',
      'Apprentice III',
      'Apprentice IV',
      'Guru I',
      'Guru II',
      'Master',
      'Enlightened',
      'Burned'
    ];

    return levels[Math.min(srsLevel - 1, levels.length - 1)] || 'Unknown';
  }
}

export default SRSEngine;
