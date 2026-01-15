import {
  startSession as dbStartSession,
  endSession as dbEndSession,
  updateSession as dbUpdateSession,
  getLastSession,
  logAttempt,
  updateCharacterMastery,
  updateUserProfile,
  getUserProfile,
  getAllCharacterMastery,
  recordSentenceShown,
  updateSentenceCompletion,
  type UserProfile,
} from "$lib/db";
import {
  calculateMasteryScore,
  getMasteryLevel,
  scheduleNextReview,
  adjustDifficulty,
  updateSpeedBaseline,
  calculateOverallSkill,
  type SentenceResult,
} from "$lib/utils/adaptive";

export interface SessionState {
  active: boolean;
  sessionId: number | null;
  totalChars: number;
  correctChars: number;
  currentStreak: number;
  maxStreak: number;
  // Timing state
  currentSentenceId: string | null;
  currentSentenceHistoryId: number | null;
  sentenceStartTime: number | null;
  tokenStartTime: number | null;
  currentTokenHintUsed: boolean;
  // Sentence-level tracking
  sentenceChars: number;
  sentenceCorrectChars: number;
  sentenceHintsUsed: number;
  sentenceTotalTimeMs: number;
  sentenceHadErrors: boolean;
  // Character timing accumulator
  charTimings: {char: string; timeMs: number; correct: boolean; hintUsed: boolean}[];
}

let state = $state<SessionState>({
  active: false,
  sessionId: null,
  totalChars: 0,
  correctChars: 0,
  currentStreak: 0,
  maxStreak: 0,
  // Timing state
  currentSentenceId: null,
  currentSentenceHistoryId: null,
  sentenceStartTime: null,
  tokenStartTime: null,
  currentTokenHintUsed: false,
  // Sentence-level tracking
  sentenceChars: 0,
  sentenceCorrectChars: 0,
  sentenceHintsUsed: 0,
  sentenceTotalTimeMs: 0,
  sentenceHadErrors: false,
  // Character timing accumulator
  charTimings: [],
});

export function getSessionState() {
  return state;
}

export async function startSession(): Promise<void> {
  const id = await dbStartSession();
  state.active = true;
  state.sessionId = id;
  state.totalChars = 0;
  state.correctChars = 0;
  state.currentStreak = 0;
  state.maxStreak = 0;
  // Reset timing state
  state.currentSentenceId = null;
  state.currentSentenceHistoryId = null;
  state.sentenceStartTime = null;
  state.tokenStartTime = null;
  state.currentTokenHintUsed = false;
  state.sentenceChars = 0;
  state.sentenceCorrectChars = 0;
  state.sentenceHintsUsed = 0;
  state.sentenceTotalTimeMs = 0;
  state.sentenceHadErrors = false;
  state.charTimings = [];
}

/**
 * Set the start of a new sentence
 */
export async function setSentenceStart(
  sentenceId: string,
  difficulty: number
): Promise<void> {
  if (!state.active || state.sessionId === null) return;

  state.currentSentenceId = sentenceId;
  state.sentenceStartTime = Date.now();
  state.tokenStartTime = null;
  state.currentTokenHintUsed = false;
  state.sentenceChars = 0;
  state.sentenceCorrectChars = 0;
  state.sentenceHintsUsed = 0;
  state.sentenceTotalTimeMs = 0;
  state.sentenceHadErrors = false;
  state.charTimings = [];

  // Record sentence shown in history
  state.currentSentenceHistoryId = await recordSentenceShown(
    sentenceId,
    state.sessionId,
    difficulty
  );
}

/**
 * Mark that the token start time should be captured on next keystroke
 */
export function prepareTokenStart(): void {
  state.tokenStartTime = null;
}

/**
 * Set the start time for current token (called on first keystroke)
 */
export function setTokenStart(): void {
  if (state.tokenStartTime === null) {
    state.tokenStartTime = Date.now();
  }
}

/**
 * Mark that a hint was used for the current token
 */
export function markHintUsed(): void {
  if (!state.currentTokenHintUsed) {
    state.currentTokenHintUsed = true;
    state.sentenceHintsUsed++;
  }
}

/**
 * Record an attempt with timing information
 */
export async function recordAttemptWithTiming(
  character: string,
  correct: boolean
): Promise<{timeMs: number}> {
  if (!state.active || state.sessionId === null) {
    return {timeMs: 0};
  }

  // Calculate time for this character
  const now = Date.now();
  const timeMs = state.tokenStartTime ? now - state.tokenStartTime : 0;

  // Update session stats
  state.totalChars++;
  state.sentenceChars++;

  if (correct) {
    state.correctChars++;
    state.sentenceCorrectChars++;
    state.currentStreak++;
    if (state.currentStreak > state.maxStreak) {
      state.maxStreak = state.currentStreak;
    }
  } else {
    state.currentStreak = 0;
    state.sentenceHadErrors = true;
  }

  state.sentenceTotalTimeMs += timeMs;

  // Store timing for later processing
  state.charTimings.push({
    char: character,
    timeMs,
    correct,
    hintUsed: state.currentTokenHintUsed,
  });

  // Log attempt to database
  if (state.currentSentenceId) {
    await logAttempt({
      sessionId: state.sessionId,
      sentenceId: state.currentSentenceId,
      character,
      correct,
      timeMs,
      hintUsed: state.currentTokenHintUsed,
    });
  }

  // Update session in DB
  await dbUpdateSession(
    state.sessionId,
    state.totalChars,
    state.correctChars,
    state.maxStreak
  );

  // Reset for next token
  state.currentTokenHintUsed = false;
  state.tokenStartTime = null;

  return {timeMs};
}

/**
 * Legacy recordAttempt for backwards compatibility
 */
export async function recordAttempt(
  character: string,
  correct: boolean
): Promise<void> {
  await recordAttemptWithTiming(character, correct);
}

/**
 * Complete the current sentence and process all character masteries
 */
export async function completeSentence(): Promise<SentenceResult | null> {
  if (
    !state.active ||
    state.sessionId === null ||
    !state.currentSentenceId
  ) {
    return null;
  }

  const sentenceId = state.currentSentenceId;
  const accuracy =
    state.sentenceChars > 0
      ? state.sentenceCorrectChars / state.sentenceChars
      : 0;
  const avgTimeMs =
    state.charTimings.length > 0
      ? state.sentenceTotalTimeMs / state.charTimings.length
      : 0;

  // Get user profile for mastery calculations
  const profile = await getUserProfile();
  const masteryMap = await getAllCharacterMastery();

  // Process each character's mastery
  for (const timing of state.charTimings) {
    const existingMastery = masteryMap.get(timing.char);

    // Calculate new mastery score
    const stats = existingMastery ?? {
      character: timing.char,
      correct: 0,
      incorrect: 0,
      accuracy: 0,
      avgTimeMs: timing.timeMs,
      hintRate: 0,
      masteryScore: 0,
      level: "new" as const,
      lastSeen: null,
      nextReview: null,
      recentTimes: [],
    };

    // Update stats with this attempt
    const newCorrect = stats.correct + (timing.correct ? 1 : 0);
    const newIncorrect = stats.incorrect + (timing.correct ? 0 : 1);
    const newTotal = newCorrect + newIncorrect;
    const newAccuracy = newTotal > 0 ? newCorrect / newTotal : 0;

    // Calculate new mastery score
    const updatedStats = {
      ...stats,
      correct: newCorrect,
      incorrect: newIncorrect,
      accuracy: newAccuracy,
      recentTimes: [...stats.recentTimes, timing.timeMs].slice(-10),
      avgTimeMs:
        stats.avgTimeMs > 0
          ? (stats.avgTimeMs + timing.timeMs) / 2
          : timing.timeMs,
    };

    const newMasteryScore = calculateMasteryScore(
      updatedStats,
      profile.speed_baseline_ms
    );
    const newLevel = getMasteryLevel(newMasteryScore, newTotal);

    // Determine performance for SRS
    const performance: "good" | "ok" | "bad" = timing.correct
      ? timing.hintUsed
        ? "ok"
        : "good"
      : "bad";

    const nextReviewAt = scheduleNextReview(newLevel, performance);

    // Update character mastery in database
    await updateCharacterMastery(timing.char, {
      correct: timing.correct,
      timeMs: timing.timeMs,
      hintUsed: timing.hintUsed,
      hintShown: true, // We always count it as shown during practice
      masteryScore: newMasteryScore,
      level: newLevel,
      nextReviewAt,
    });
  }

  // Update sentence history with completion stats
  if (state.currentSentenceHistoryId) {
    await updateSentenceCompletion(state.currentSentenceHistoryId, {
      accuracy,
      avgTimeMs,
      hintsUsed: state.sentenceHintsUsed,
    });
  }

  // Adjust difficulty based on performance
  const result: SentenceResult = {
    sentenceId,
    accuracy,
    avgTimeMs,
    totalTimeMs: state.sentenceTotalTimeMs,
    hintsUsed: state.sentenceHintsUsed,
    totalChars: state.sentenceChars,
    correctChars: state.sentenceCorrectChars,
    hadErrors: state.sentenceHadErrors,
  };

  const difficultyUpdates = adjustDifficulty(profile, result);

  // Update speed baseline
  const newSpeedBaseline = updateSpeedBaseline(
    profile.speed_baseline_ms,
    avgTimeMs
  );

  // Recalculate overall skill
  const updatedMasteryMap = await getAllCharacterMastery();
  const overallSkill = calculateOverallSkill(updatedMasteryMap);

  // Persist profile updates
  await updateUserProfile({
    ...difficultyUpdates,
    speed_baseline_ms: newSpeedBaseline,
    overall_skill: overallSkill,
    total_practice_ms: profile.total_practice_ms + state.sentenceTotalTimeMs,
    chars_typed_total: profile.chars_typed_total + state.sentenceChars,
  });

  // Reset sentence state for next sentence
  state.currentSentenceId = null;
  state.currentSentenceHistoryId = null;
  state.sentenceStartTime = null;
  state.charTimings = [];

  return result;
}

export async function endSession(): Promise<void> {
  if (!state.active || state.sessionId === null) return;

  await dbEndSession(
    state.sessionId,
    state.totalChars,
    state.correctChars,
    state.maxStreak
  );

  state.active = false;
  state.sessionId = null;
}

export async function loadLastSession(): Promise<{
  accuracy: number;
  maxStreak: number;
} | null> {
  const last = await getLastSession();
  if (!last || last.total_chars === 0) return null;

  return {
    accuracy: Math.round((last.correct_chars / last.total_chars) * 100),
    maxStreak: last.max_streak,
  };
}
