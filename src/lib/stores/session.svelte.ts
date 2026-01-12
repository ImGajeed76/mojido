import {
  startSession as dbStartSession,
  endSession as dbEndSession,
  updateSession as dbUpdateSession,
  getLastSession,
  updateProgress,
} from "$lib/db";

export interface SessionState {
  active: boolean;
  sessionId: number | null;
  totalChars: number;
  correctChars: number;
  currentStreak: number;
  maxStreak: number;
}

let state = $state<SessionState>({
  active: false,
  sessionId: null,
  totalChars: 0,
  correctChars: 0,
  currentStreak: 0,
  maxStreak: 0,
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
}

export async function recordAttempt(
  character: string,
  correct: boolean
): Promise<void> {
  if (!state.active || state.sessionId === null) return;

  state.totalChars++;
  if (correct) {
    state.correctChars++;
    state.currentStreak++;
    if (state.currentStreak > state.maxStreak) {
      state.maxStreak = state.currentStreak;
    }
  } else {
    state.currentStreak = 0;
  }

  await updateProgress(character, correct);
  await dbUpdateSession(
    state.sessionId,
    state.totalChars,
    state.correctChars,
    state.maxStreak
  );
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
