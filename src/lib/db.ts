import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:mojido.db");
  }
  return db;
}

export interface ProgressRecord {
  id: number;
  character: string;
  correct: number;
  incorrect: number;
  last_seen: number | null;
  mastery: number;
  // Adaptive learning fields
  hint_shown: number;
  hint_used: number;
  total_time_ms: number;
  attempt_count: number;
  best_time_ms: number | null;
  recent_times: string; // JSON array
  mastery_score: number;
  level: "new" | "learning" | "reviewing" | "mastered";
  next_review_at: number | null;
}

export interface UserProfile {
  id: number;
  overall_skill: number;
  current_difficulty: number;
  speed_baseline_ms: number;
  consecutive_perfect: number;
  consecutive_struggle: number;
  total_practice_ms: number;
  chars_typed_total: number;
  created_at: number;
  updated_at: number;
}

export interface AttemptLogRecord {
  id: number;
  session_id: number;
  sentence_id: string;
  character: string;
  correct: number;
  time_ms: number | null;
  hint_used: number;
  typed_wrong: string | null;
  created_at: number;
}

export interface SentenceHistoryRecord {
  id: number;
  sentence_id: string;
  session_id: number | null;
  difficulty_at_time: number | null;
  accuracy: number | null;
  avg_time_ms: number | null;
  hints_used: number;
  shown_at: number;
  completed_at: number | null;
}

export interface SessionRecord {
  id: number;
  started_at: number;
  ended_at: number | null;
  total_chars: number;
  correct_chars: number;
  max_streak: number;
}

export async function getProgress(
  character: string
): Promise<ProgressRecord | null> {
  const db = await getDb();
  const result = await db.select<ProgressRecord[]>(
    "SELECT * FROM progress WHERE character = ?",
    [character]
  );
  return result[0] ?? null;
}

export async function updateProgress(
  character: string,
  correct: boolean
): Promise<void> {
  const db = await getDb();
  const now = Date.now();

  await db.execute(
    `INSERT INTO progress (character, correct, incorrect, last_seen, mastery)
     VALUES (?, ?, ?, ?, 0)
     ON CONFLICT(character) DO UPDATE SET
       correct = correct + ?,
       incorrect = incorrect + ?,
       last_seen = ?,
       mastery = CAST((correct + ?) AS REAL) / (correct + incorrect + 1)`,
    [
      character,
      correct ? 1 : 0,
      correct ? 0 : 1,
      now,
      correct ? 1 : 0,
      correct ? 0 : 1,
      now,
      correct ? 1 : 0,
    ]
  );
}

export async function getAllProgress(): Promise<ProgressRecord[]> {
  const db = await getDb();
  return db.select<ProgressRecord[]>("SELECT * FROM progress");
}

export async function startSession(): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    "INSERT INTO sessions (started_at, total_chars, correct_chars, max_streak) VALUES (?, 0, 0, 0)",
    [Date.now()]
  );
  return result.lastInsertId ?? 0;
}

export async function updateSession(
  id: number,
  totalChars: number,
  correctChars: number,
  maxStreak: number
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE sessions SET total_chars = ?, correct_chars = ?, max_streak = ? WHERE id = ?",
    [totalChars, correctChars, maxStreak, id]
  );
}

export async function endSession(
  id: number,
  totalChars: number,
  correctChars: number,
  maxStreak: number
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE sessions SET ended_at = ?, total_chars = ?, correct_chars = ?, max_streak = ? WHERE id = ?",
    [Date.now(), totalChars, correctChars, maxStreak, id]
  );
}

export async function getLastSession(): Promise<SessionRecord | null> {
  const db = await getDb();
  const result = await db.select<SessionRecord[]>(
    "SELECT * FROM sessions WHERE ended_at IS NOT NULL ORDER BY ended_at DESC LIMIT 1"
  );
  return result[0] ?? null;
}

// Day streak functions

export interface DailyActivityRecord {
  date: string;
  sentences_completed: number;
  first_sentence_at: number | null;
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}

export async function recordSentenceCompleted(): Promise<{
  isFirstToday: boolean;
}> {
  const db = await getDb();
  const today = getTodayDate();
  const now = Date.now();

  // Check if we already have activity today
  const existing = await db.select<DailyActivityRecord[]>(
    "SELECT * FROM daily_activity WHERE date = ?",
    [today]
  );

  const isFirstToday = existing.length === 0;

  if (isFirstToday) {
    // First sentence of the day
    await db.execute(
      "INSERT INTO daily_activity (date, sentences_completed, first_sentence_at) VALUES (?, 1, ?)",
      [today, now]
    );
  } else {
    // Increment count
    await db.execute(
      "UPDATE daily_activity SET sentences_completed = sentences_completed + 1 WHERE date = ?",
      [today]
    );
  }

  return {isFirstToday};
}

export async function getDayStreak(): Promise<number> {
  const db = await getDb();

  // Get all activity dates ordered by date descending
  const activities = await db.select<{date: string}[]>(
    "SELECT date FROM daily_activity ORDER BY date DESC"
  );

  if (activities.length === 0) return 0;

  const today = getTodayDate();
  const yesterday = getDateString(1);

  // Check if user practiced today or yesterday (streak is still active)
  const lastDate = activities[0].date;
  if (lastDate !== today && lastDate !== yesterday) {
    return 0; // Streak broken
  }

  // Count consecutive days
  let streak = 0;
  let expectedDate = lastDate === today ? today : yesterday;

  for (const activity of activities) {
    if (activity.date === expectedDate) {
      streak++;
      // Calculate the previous day
      const date = new Date(expectedDate);
      date.setDate(date.getDate() - 1);
      expectedDate = date.toISOString().split("T")[0];
    } else {
      break;
    }
  }

  return streak;
}

export async function hasPracticedToday(): Promise<boolean> {
  const db = await getDb();
  const today = getTodayDate();
  const result = await db.select<DailyActivityRecord[]>(
    "SELECT * FROM daily_activity WHERE date = ?",
    [today]
  );
  return result.length > 0;
}

// ============================================
// Adaptive Learning System Functions
// ============================================

// User Profile Management

export async function initUserProfile(): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.execute(
    `INSERT OR IGNORE INTO user_profile (id, created_at, updated_at) VALUES (1, ?, ?)`,
    [now, now]
  );
}

export async function getUserProfile(): Promise<UserProfile> {
  const db = await getDb();
  await initUserProfile();
  const result = await db.select<UserProfile[]>(
    "SELECT * FROM user_profile WHERE id = 1"
  );
  return result[0];
}

export async function updateUserProfile(
  updates: Partial<Omit<UserProfile, "id" | "created_at">>
): Promise<void> {
  const db = await getDb();
  const now = Date.now();

  const fields: string[] = ["updated_at = ?"];
  const values: (string | number)[] = [now];

  if (updates.overall_skill !== undefined) {
    fields.push("overall_skill = ?");
    values.push(updates.overall_skill);
  }
  if (updates.current_difficulty !== undefined) {
    fields.push("current_difficulty = ?");
    values.push(updates.current_difficulty);
  }
  if (updates.speed_baseline_ms !== undefined) {
    fields.push("speed_baseline_ms = ?");
    values.push(updates.speed_baseline_ms);
  }
  if (updates.consecutive_perfect !== undefined) {
    fields.push("consecutive_perfect = ?");
    values.push(updates.consecutive_perfect);
  }
  if (updates.consecutive_struggle !== undefined) {
    fields.push("consecutive_struggle = ?");
    values.push(updates.consecutive_struggle);
  }
  if (updates.total_practice_ms !== undefined) {
    fields.push("total_practice_ms = ?");
    values.push(updates.total_practice_ms);
  }
  if (updates.chars_typed_total !== undefined) {
    fields.push("chars_typed_total = ?");
    values.push(updates.chars_typed_total);
  }

  await db.execute(
    `UPDATE user_profile SET ${fields.join(", ")} WHERE id = 1`,
    values
  );
}

// Attempt Logging

export async function logAttempt(data: {
  sessionId: number;
  sentenceId: string;
  character: string;
  correct: boolean;
  timeMs: number | null;
  hintUsed: boolean;
  typedWrong?: string;
}): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO attempt_log (session_id, sentence_id, character, correct, time_ms, hint_used, typed_wrong, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.sessionId,
      data.sentenceId,
      data.character,
      data.correct ? 1 : 0,
      data.timeMs,
      data.hintUsed ? 1 : 0,
      data.typedWrong ?? null,
      Date.now(),
    ]
  );
}

// Character Mastery

export interface CharacterMasteryData {
  character: string;
  correct: number;
  incorrect: number;
  accuracy: number;
  avgTimeMs: number;
  hintRate: number;
  masteryScore: number;
  level: "new" | "learning" | "reviewing" | "mastered";
  lastSeen: number | null;
  nextReview: number | null;
  recentTimes: number[];
}

export async function getCharacterMastery(
  character: string
): Promise<CharacterMasteryData | null> {
  const db = await getDb();
  const result = await db.select<ProgressRecord[]>(
    "SELECT * FROM progress WHERE character = ?",
    [character]
  );

  if (result.length === 0) return null;

  const record = result[0];
  const total = record.correct + record.incorrect;

  return {
    character: record.character,
    correct: record.correct,
    incorrect: record.incorrect,
    accuracy: total > 0 ? record.correct / total : 0,
    avgTimeMs:
      record.attempt_count > 0
        ? record.total_time_ms / record.attempt_count
        : 0,
    hintRate:
      record.hint_shown > 0 ? record.hint_used / record.hint_shown : 0,
    masteryScore: record.mastery_score,
    level: record.level,
    lastSeen: record.last_seen,
    nextReview: record.next_review_at,
    recentTimes: JSON.parse(record.recent_times || "[]"),
  };
}

export async function getAllCharacterMastery(): Promise<
  Map<string, CharacterMasteryData>
> {
  const db = await getDb();
  const records = await db.select<ProgressRecord[]>("SELECT * FROM progress");

  const map = new Map<string, CharacterMasteryData>();
  for (const record of records) {
    const total = record.correct + record.incorrect;
    map.set(record.character, {
      character: record.character,
      correct: record.correct,
      incorrect: record.incorrect,
      accuracy: total > 0 ? record.correct / total : 0,
      avgTimeMs:
        record.attempt_count > 0
          ? record.total_time_ms / record.attempt_count
          : 0,
      hintRate:
        record.hint_shown > 0 ? record.hint_used / record.hint_shown : 0,
      masteryScore: record.mastery_score,
      level: record.level,
      lastSeen: record.last_seen,
      nextReview: record.next_review_at,
      recentTimes: JSON.parse(record.recent_times || "[]"),
    });
  }

  return map;
}

export async function updateCharacterMastery(
  character: string,
  data: {
    correct: boolean;
    timeMs: number;
    hintUsed: boolean;
    hintShown: boolean;
    masteryScore: number;
    level: "new" | "learning" | "reviewing" | "mastered";
    nextReviewAt?: number;
  }
): Promise<void> {
  const db = await getDb();
  const now = Date.now();

  // Get existing record to update recent_times
  const existing = await db.select<ProgressRecord[]>(
    "SELECT * FROM progress WHERE character = ?",
    [character]
  );

  let recentTimes: number[] = [];
  if (existing.length > 0) {
    recentTimes = JSON.parse(existing[0].recent_times || "[]");
  }

  // Add new time and keep last 10
  recentTimes.push(data.timeMs);
  if (recentTimes.length > 10) {
    recentTimes = recentTimes.slice(-10);
  }

  const bestTime =
    existing.length > 0 && existing[0].best_time_ms !== null
      ? Math.min(existing[0].best_time_ms, data.timeMs)
      : data.timeMs;

  await db.execute(
    `INSERT INTO progress (
      character, correct, incorrect, last_seen, mastery,
      hint_shown, hint_used, total_time_ms, attempt_count, best_time_ms,
      recent_times, mastery_score, level, next_review_at
    ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, 1, ?, ?, ?, ?, ?)
    ON CONFLICT(character) DO UPDATE SET
      correct = correct + ?,
      incorrect = incorrect + ?,
      last_seen = ?,
      hint_shown = hint_shown + ?,
      hint_used = hint_used + ?,
      total_time_ms = total_time_ms + ?,
      attempt_count = attempt_count + 1,
      best_time_ms = ?,
      recent_times = ?,
      mastery_score = ?,
      level = ?,
      next_review_at = ?,
      mastery = CAST((correct + ?) AS REAL) / (correct + incorrect + 1)`,
    [
      // INSERT values
      character,
      data.correct ? 1 : 0,
      data.correct ? 0 : 1,
      now,
      data.hintShown ? 1 : 0,
      data.hintUsed ? 1 : 0,
      data.timeMs,
      bestTime,
      JSON.stringify(recentTimes),
      data.masteryScore,
      data.level,
      data.nextReviewAt ?? null,
      // UPDATE values
      data.correct ? 1 : 0,
      data.correct ? 0 : 1,
      now,
      data.hintShown ? 1 : 0,
      data.hintUsed ? 1 : 0,
      data.timeMs,
      bestTime,
      JSON.stringify(recentTimes),
      data.masteryScore,
      data.level,
      data.nextReviewAt ?? null,
      data.correct ? 1 : 0,
    ]
  );
}

// Sentence History

export async function getRecentSentenceIds(limit: number): Promise<string[]> {
  const db = await getDb();
  const result = await db.select<{sentence_id: string}[]>(
    "SELECT sentence_id FROM sentence_history ORDER BY shown_at DESC LIMIT ?",
    [limit]
  );
  return result.map((r) => r.sentence_id);
}

export async function recordSentenceShown(
  sentenceId: string,
  sessionId: number,
  difficulty: number
): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO sentence_history (sentence_id, session_id, difficulty_at_time, shown_at)
     VALUES (?, ?, ?, ?)`,
    [sentenceId, sessionId, difficulty, Date.now()]
  );
  return result.lastInsertId ?? 0;
}

export async function updateSentenceCompletion(
  historyId: number,
  stats: {
    accuracy: number;
    avgTimeMs: number;
    hintsUsed: number;
  }
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE sentence_history SET
       accuracy = ?,
       avg_time_ms = ?,
       hints_used = ?,
       completed_at = ?
     WHERE id = ?`,
    [stats.accuracy, stats.avgTimeMs, stats.hintsUsed, Date.now(), historyId]
  );
}

// SRS-style review scheduling

export async function getCharactersDueForReview(): Promise<
  CharacterMasteryData[]
> {
  const db = await getDb();
  const now = Date.now();

  const records = await db.select<ProgressRecord[]>(
    `SELECT * FROM progress
     WHERE next_review_at IS NOT NULL AND next_review_at <= ?
     ORDER BY next_review_at ASC`,
    [now]
  );

  return records.map((record) => {
    const total = record.correct + record.incorrect;
    return {
      character: record.character,
      correct: record.correct,
      incorrect: record.incorrect,
      accuracy: total > 0 ? record.correct / total : 0,
      avgTimeMs:
        record.attempt_count > 0
          ? record.total_time_ms / record.attempt_count
          : 0,
      hintRate:
        record.hint_shown > 0 ? record.hint_used / record.hint_shown : 0,
      masteryScore: record.mastery_score,
      level: record.level,
      lastSeen: record.last_seen,
      nextReview: record.next_review_at,
      recentTimes: JSON.parse(record.recent_times || "[]"),
    };
  });
}

// ============================================
// Stats Page Functions
// ============================================

export interface MasteryDistribution {
  new: number;
  learning: number;
  reviewing: number;
  mastered: number;
  total: number;
}

export async function getMasteryDistribution(): Promise<MasteryDistribution> {
  const db = await getDb();
  const result = await db.select<{level: string; count: number}[]>(
    `SELECT level, COUNT(*) as count FROM progress GROUP BY level`
  );

  const distribution: MasteryDistribution = {
    new: 0,
    learning: 0,
    reviewing: 0,
    mastered: 0,
    total: 0,
  };

  for (const row of result) {
    if (row.level === "new") distribution.new = row.count;
    else if (row.level === "learning") distribution.learning = row.count;
    else if (row.level === "reviewing") distribution.reviewing = row.count;
    else if (row.level === "mastered") distribution.mastered = row.count;
    distribution.total += row.count;
  }

  return distribution;
}

export interface SessionSummary {
  id: number;
  startedAt: number;
  endedAt: number;
  totalChars: number;
  correctChars: number;
  maxStreak: number;
  accuracy: number;
  durationMs: number;
}

export async function getRecentSessions(
  limit: number
): Promise<SessionSummary[]> {
  const db = await getDb();
  const records = await db.select<SessionRecord[]>(
    `SELECT * FROM sessions
     WHERE ended_at IS NOT NULL
     ORDER BY ended_at DESC
     LIMIT ?`,
    [limit]
  );

  return records.map((record) => ({
    id: record.id,
    startedAt: record.started_at,
    endedAt: record.ended_at!,
    totalChars: record.total_chars,
    correctChars: record.correct_chars,
    maxStreak: record.max_streak,
    accuracy:
      record.total_chars > 0
        ? Math.round((record.correct_chars / record.total_chars) * 100)
        : 0,
    durationMs: record.ended_at! - record.started_at,
  }));
}

export async function getTotalSessions(): Promise<number> {
  const db = await getDb();
  const result = await db.select<{count: number}[]>(
    `SELECT COUNT(*) as count FROM sessions WHERE ended_at IS NOT NULL`
  );
  return result[0]?.count ?? 0;
}

// ============================================
// Enhanced Stats Functions
// ============================================

/**
 * Get overall accuracy from recent sessions
 */
export async function getOverallAccuracy(
  sessionLimit: number = 10
): Promise<number> {
  const db = await getDb();
  const result = await db.select<{total: number; correct: number}[]>(
    `SELECT SUM(total_chars) as total, SUM(correct_chars) as correct
     FROM (
       SELECT total_chars, correct_chars FROM sessions
       WHERE ended_at IS NOT NULL AND total_chars > 0
       ORDER BY ended_at DESC
       LIMIT ?
     )`
  , [sessionLimit]);

  if (!result[0] || result[0].total === 0) return 0;
  return Math.round((result[0].correct / result[0].total) * 100);
}

/**
 * Get characters that need the most work (lowest accuracy, minimum attempts)
 */
export async function getWeakCharacters(
  limit: number = 5,
  minAttempts: number = 3
): Promise<CharacterMasteryData[]> {
  const db = await getDb();
  const records = await db.select<ProgressRecord[]>(
    `SELECT * FROM progress
     WHERE (correct + incorrect) >= ?
     ORDER BY mastery_score ASC, (correct + incorrect) DESC
     LIMIT ?`,
    [minAttempts, limit]
  );

  return records.map((record) => {
    const total = record.correct + record.incorrect;
    return {
      character: record.character,
      correct: record.correct,
      incorrect: record.incorrect,
      accuracy: total > 0 ? record.correct / total : 0,
      avgTimeMs:
        record.attempt_count > 0
          ? record.total_time_ms / record.attempt_count
          : 0,
      hintRate:
        record.hint_shown > 0 ? record.hint_used / record.hint_shown : 0,
      masteryScore: record.mastery_score,
      level: record.level,
      lastSeen: record.last_seen,
      nextReview: record.next_review_at,
      recentTimes: JSON.parse(record.recent_times || "[]"),
    };
  });
}

/**
 * Get average response time across all practiced characters
 */
export async function getAverageResponseTime(): Promise<number> {
  const db = await getDb();
  const result = await db.select<{total_time: number; total_attempts: number}[]>(
    `SELECT SUM(total_time_ms) as total_time, SUM(attempt_count) as total_attempts
     FROM progress
     WHERE attempt_count > 0`
  );

  if (!result[0] || result[0].total_attempts === 0) return 0;
  return Math.round(result[0].total_time / result[0].total_attempts);
}

/**
 * Get speed baseline from user profile
 */
export async function getSpeedBaseline(): Promise<number> {
  const profile = await getUserProfile();
  return profile.speed_baseline_ms;
}

/**
 * Get characters sorted by accuracy for the mastery grid
 * Returns accuracy value (0-1) for each practiced character
 */
export async function getCharacterAccuracyMap(): Promise<Map<string, number>> {
  const db = await getDb();
  const records = await db.select<{character: string; correct: number; incorrect: number}[]>(
    `SELECT character, correct, incorrect FROM progress`
  );

  const map = new Map<string, number>();
  for (const record of records) {
    const total = record.correct + record.incorrect;
    if (total > 0) {
      map.set(record.character, record.correct / total);
    }
  }

  return map;
}
