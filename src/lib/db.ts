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
