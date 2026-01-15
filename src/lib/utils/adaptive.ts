/**
 * Adaptive Learning Engine for Mojido
 *
 * Provides intelligent sentence selection and difficulty adjustment
 * based on user performance metrics.
 */

import type {Sentence} from "$lib/data/sentences";
import type {CharacterMasteryData, UserProfile} from "$lib/db";

// ============================================
// Types
// ============================================

export interface SentenceResult {
  sentenceId: string;
  accuracy: number;
  avgTimeMs: number;
  totalTimeMs: number;
  hintsUsed: number;
  totalChars: number;
  correctChars: number;
  hadErrors: boolean;
}

interface ScoredSentence {
  sentence: Sentence;
  difficulty: number;
  fitScore: number;
  hasKanji: boolean;
  charCount: number;
}

// ============================================
// Katakana to Hiragana Conversion
// ============================================

const KATAKANA_START = 0x30a0;
const HIRAGANA_START = 0x3040;

/**
 * Convert katakana character to hiragana
 */
function toHiragana(char: string): string {
  const code = char.charCodeAt(0);
  // Katakana range: 0x30A0 - 0x30FF
  if (code >= 0x30a1 && code <= 0x30f6) {
    return String.fromCharCode(code - KATAKANA_START + HIRAGANA_START);
  }
  // Handle ー (prolonged sound mark) - keep as is for now
  if (char === "ー") return "ー";
  return char;
}

/**
 * Convert a string from katakana to hiragana
 */
function toHiraganaString(str: string): string {
  return [...str].map(toHiragana).join("");
}

// ============================================
// Character Intrinsic Difficulty
// ============================================

// Hiragana basic characters
const HIRAGANA_BASIC =
  "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";

// Hiragana with dakuten/handakuten
const HIRAGANA_VOICED = "がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ";

// Hiragana small characters and combinations
const HIRAGANA_SMALL = "ぁぃぅぇぉっゃゅょ";

/**
 * Get the intrinsic difficulty of a character (before user mastery adjustment)
 * All characters are normalized to hiragana first
 */
export function getIntrinsicDifficulty(char: string): number {
  // Punctuation - no difficulty
  if (/[。、？！「」『』（）・ー]/.test(char)) {
    return 0;
  }

  // Normalize katakana to hiragana for comparison
  const normalized = toHiragana(char);

  // Check if original was katakana (adds slight difficulty)
  const wasKatakana = normalized !== char && char !== "ー";

  // Basic hiragana vowels - easiest
  if ("あいうえお".includes(normalized)) {
    return wasKatakana ? 1.1 : 0.8;
  }

  // Basic hiragana consonants
  if (HIRAGANA_BASIC.includes(normalized)) {
    return wasKatakana ? 1.2 : 1.0;
  }

  // Voiced hiragana
  if (HIRAGANA_VOICED.includes(normalized)) {
    return wasKatakana ? 1.3 : 1.1;
  }

  // Small hiragana (combinations)
  if (HIRAGANA_SMALL.includes(normalized)) {
    return wasKatakana ? 1.5 : 1.3;
  }

  // Unknown character (probably kanji that slipped through) - very high
  return 2.5;
}

// ============================================
// Mastery Score Calculation
// ============================================

/**
 * Calculate normalized variance for consistency scoring
 * Returns 0-1 where 0 is perfectly consistent
 */
function normalizedVariance(times: number[]): number {
  if (times.length < 2) return 0.5;

  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  if (mean === 0) return 0.5;

  const variance =
    times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);

  // Normalize: stdDev of 500ms or more = max inconsistency
  return Math.min(1, stdDev / 500);
}

/**
 * Calculate days since a timestamp
 */
function daysSince(timestamp: number | null): number {
  if (!timestamp) return 30; // Treat never-seen as 30 days ago
  return (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
}

/**
 * Calculate composite mastery score for a character
 * Returns 0.0 to 1.0
 */
export function calculateMasteryScore(
  stats: CharacterMasteryData,
  speedBaselineMs: number
): number {
  const total = stats.correct + stats.incorrect;

  // Not enough data - treat as new
  if (total < 3) {
    return 0;
  }

  // Accuracy component (0-1)
  const accuracy = stats.accuracy;

  // Speed component (0-1, relative to user's baseline)
  const avgTime = stats.avgTimeMs || speedBaselineMs;
  const speedScore = Math.min(1, speedBaselineMs / Math.max(100, avgTime));

  // Consistency component (0-1, based on variance of recent times)
  const consistency = 1 - normalizedVariance(stats.recentTimes);

  // Hint independence component (0-1)
  const hintFreedom = 1 - stats.hintRate;

  // Recency decay - characters not practiced recently lose some mastery
  const recencyFactor = Math.max(0.5, 1 - daysSince(stats.lastSeen) * 0.03);

  // Weighted composite
  const rawScore =
    accuracy * 0.3 +
    speedScore * 0.25 +
    consistency * 0.2 +
    hintFreedom * 0.25;

  return rawScore * recencyFactor;
}

/**
 * Determine mastery level from score
 */
export function getMasteryLevel(
  score: number,
  attemptCount: number
): "new" | "learning" | "reviewing" | "mastered" {
  if (attemptCount < 3) return "new";
  if (score < 0.4) return "learning";
  if (score < 0.75) return "reviewing";
  return "mastered";
}

/**
 * Calculate next review time based on performance
 * Returns timestamp in milliseconds
 */
export function scheduleNextReview(
  currentLevel: "new" | "learning" | "reviewing" | "mastered",
  performance: "good" | "ok" | "bad"
): number {
  const now = Date.now();
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  // Intervals based on level and performance
  const intervals: Record<string, Record<string, number>> = {
    new: {good: 5 * MINUTE, ok: 2 * MINUTE, bad: 1 * MINUTE},
    learning: {good: 30 * MINUTE, ok: 10 * MINUTE, bad: 5 * MINUTE},
    reviewing: {good: 1 * DAY, ok: 4 * HOUR, bad: 1 * HOUR},
    mastered: {good: 3 * DAY, ok: 1 * DAY, bad: 4 * HOUR},
  };

  return now + intervals[currentLevel][performance];
}

// ============================================
// Sentence Analysis
// ============================================

/**
 * Check if a sentence contains kanji tokens
 */
function hasKanjiTokens(sentence: Sentence): boolean {
  return sentence.tokens.some((t) => t.isKanji);
}

/**
 * Count kanji tokens in a sentence
 */
function countKanjiTokens(sentence: Sentence): number {
  return sentence.tokens.filter((t) => t.isKanji).length;
}

/**
 * Get total character count from readings
 */
function getCharacterCount(sentence: Sentence): number {
  let count = 0;
  for (const token of sentence.tokens) {
    for (const char of token.reading) {
      if (!/[。、？！「」『』（）・]/.test(char)) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Extract all kana characters from a sentence (normalized to hiragana)
 */
export function extractKanaCharacters(sentence: Sentence): string[] {
  const chars: string[] = [];

  for (const token of sentence.tokens) {
    // Convert reading to hiragana for consistent tracking
    const reading = toHiraganaString(token.reading);
    for (const char of reading) {
      // Skip punctuation
      if (!/[。、？！「」『』（）・ー]/.test(char)) {
        chars.push(char);
      }
    }
  }

  return chars;
}

/**
 * Calculate sentence difficulty based on multiple factors
 */
export function calculateSentenceDifficulty(
  sentence: Sentence,
  masteryMap: Map<string, CharacterMasteryData>
): number {
  // Start with the static difficulty as a base
  let baseDifficulty = sentence.difficulty;

  // MAJOR PENALTY: Kanji presence
  const kanjiCount = countKanjiTokens(sentence);
  if (kanjiCount > 0) {
    // Each kanji token adds significant difficulty
    baseDifficulty += kanjiCount * 0.8;
  }

  // Get characters for mastery-based adjustment
  const chars = extractKanaCharacters(sentence);
  if (chars.length === 0) {
    return baseDifficulty;
  }

  // Calculate character-based difficulty
  let charDifficulty = 0;
  let charCount = 0;
  let unknownCount = 0;

  for (const char of chars) {
    const intrinsic = getIntrinsicDifficulty(char);
    if (intrinsic === 0) continue; // Skip punctuation

    // Check mastery (use hiragana-normalized character)
    const normalized = toHiragana(char);
    const mastery = masteryMap.get(normalized);
    const masteryScore = mastery?.masteryScore ?? 0;

    // Track unknown characters
    if (!mastery || mastery.level === "new") {
      unknownCount++;
    }

    // Unknown characters are harder, mastered are easier
    const userAdjusted = intrinsic * (1.5 - masteryScore);
    charDifficulty += userAdjusted;
    charCount++;
  }

  if (charCount === 0) {
    return baseDifficulty;
  }

  // Average character difficulty
  const avgCharDifficulty = charDifficulty / charCount;

  // Penalty for too many unknown characters (more than 50%)
  const unknownRatio = unknownCount / charCount;
  const unknownPenalty = unknownRatio > 0.5 ? (unknownRatio - 0.5) * 2 : 0;

  // Length factor - longer sentences are harder
  const lengthFactor = 1 + Math.max(0, (sentence.tokens.length - 4) * 0.1);

  // Combine factors
  const finalDifficulty =
    (baseDifficulty * 0.4 + avgCharDifficulty * 0.6 + unknownPenalty) *
    lengthFactor;

  return finalDifficulty;
}

// ============================================
// Sentence Selection Algorithm
// ============================================

/**
 * Get the maximum allowed static difficulty based on user's current level
 */
function getMaxAllowedDifficulty(profile: UserProfile): number {
  const currentDiff = profile.current_difficulty;

  // Very conservative limits based on user level
  if (currentDiff < 1.2) return 1.2; // Beginner: only difficulty 1-1.2 sentences
  if (currentDiff < 1.5) return 1.5; // Early: up to 1.5
  if (currentDiff < 2.0) return 2.0; // Intermediate: up to 2.0
  if (currentDiff < 3.0) return 2.5; // Advanced: up to 2.5
  return 3.5; // Expert: up to 3.5
}

/**
 * Check if user is ready for kanji sentences
 */
function isReadyForKanji(
  masteryMap: Map<string, CharacterMasteryData>
): boolean {
  // Count characters at different mastery levels
  let masteredCount = 0;
  let learningCount = 0;

  for (const mastery of masteryMap.values()) {
    if (mastery.level === "mastered" || mastery.level === "reviewing") {
      masteredCount++;
    } else if (mastery.level === "learning") {
      learningCount++;
    }
  }

  // Need at least 30 characters mastered/reviewing before kanji
  return masteredCount >= 30;
}

/**
 * Filter sentences to appropriate difficulty level
 */
function filterSentencesByLevel(
  sentences: Sentence[],
  profile: UserProfile,
  masteryMap: Map<string, CharacterMasteryData>
): Sentence[] {
  const maxDifficulty = getMaxAllowedDifficulty(profile);
  const kanjiReady = isReadyForKanji(masteryMap);

  return sentences.filter((sentence) => {
    // Filter by static difficulty
    if (sentence.difficulty > maxDifficulty) {
      return false;
    }

    // Filter out kanji sentences if not ready
    if (!kanjiReady && hasKanjiTokens(sentence)) {
      return false;
    }

    return true;
  });
}

/**
 * Calculate fit score for a sentence
 */
function calculateFitScore(
  sentence: Sentence,
  difficulty: number,
  targetDifficulty: number,
  masteryMap: Map<string, CharacterMasteryData>
): number {
  // How well does difficulty match target?
  const difficultyMatch =
    1 - Math.abs(difficulty - targetDifficulty) / Math.max(1, targetDifficulty);

  // Bonus for sentences with characters due for review
  const chars = extractKanaCharacters(sentence);
  const now = Date.now();
  let reviewDueCount = 0;
  let newCharCount = 0;
  const uniqueChars = new Set(chars);

  for (const char of uniqueChars) {
    const normalized = toHiragana(char);
    const mastery = masteryMap.get(normalized);

    if (mastery?.nextReview && mastery.nextReview <= now) {
      reviewDueCount++;
    }
    if (!mastery || mastery.level === "new") {
      newCharCount++;
    }
  }

  const reviewBonus = Math.min(0.3, reviewDueCount * 0.1);

  // Ideal: 1-3 new characters per sentence
  let newCharBonus = 0;
  if (newCharCount >= 1 && newCharCount <= 3) {
    newCharBonus = 0.2;
  } else if (newCharCount > 5) {
    newCharBonus = -0.3; // Too many new chars is bad
  }

  return difficultyMatch * 0.5 + reviewBonus * 0.3 + newCharBonus * 0.2;
}

/**
 * Main sentence selection algorithm
 */
export function selectNextSentence(
  profile: UserProfile,
  sentences: Sentence[],
  masteryMap: Map<string, CharacterMasteryData>,
  recentIds: string[]
): Sentence {
  const targetDifficulty = profile.current_difficulty;
  const maxAllowed = getMaxAllowedDifficulty(profile);
  const kanjiReady = isReadyForKanji(masteryMap);

  console.log("=== SENTENCE SELECTION ===");
  console.log(`User profile: difficulty=${targetDifficulty.toFixed(2)}, maxAllowed=${maxAllowed}, kanjiReady=${kanjiReady}`);
  console.log(`Mastery map size: ${masteryMap.size} characters tracked`);

  // Step 1: Filter to appropriate level
  const levelFiltered = filterSentencesByLevel(sentences, profile, masteryMap);
  console.log(`After level filter: ${levelFiltered.length} sentences (from ${sentences.length} total)`);

  // Step 2: Filter out recently shown sentences
  const recentSet = new Set(recentIds.slice(0, 15));
  const available = levelFiltered.filter((s) => !recentSet.has(s.id));
  console.log(`After recent filter: ${available.length} sentences (excluded ${recentIds.length} recent)`);

  // Fallback if too few available - but ALWAYS exclude at least the last 3 sentences
  let pool: Sentence[];
  if (available.length >= 3) {
    pool = available;
  } else {
    // Fallback: include more sentences but still exclude the MOST recent ones
    const veryRecentSet = new Set(recentIds.slice(0, 3)); // Always exclude last 3
    pool = levelFiltered.filter((s) => !veryRecentSet.has(s.id));
    console.log(`Fallback mode: excluding only last 3, pool now ${pool.length}`);
  }
  console.log(`Final pool: ${pool.length} sentences`);

  if (pool.length === 0) {
    console.log("WARNING: Empty pool! Using fallback");
    // Ultimate fallback: just pick any sentence not recently shown
    const anyAvailable = sentences.filter((s) => !recentSet.has(s.id));
    if (anyAvailable.length > 0) {
      const selected = anyAvailable[Math.floor(Math.random() * anyAvailable.length)];
      console.log(`FALLBACK selected: [${selected.id}] difficulty=${selected.difficulty}`);
      return selected;
    }
    console.log("CRITICAL: No sentences available, returning first");
    return sentences[0];
  }

  // Step 3: Score each sentence
  const scored: ScoredSentence[] = pool.map((sentence) => {
    const difficulty = calculateSentenceDifficulty(sentence, masteryMap);
    const fitScore = calculateFitScore(
      sentence,
      difficulty,
      targetDifficulty,
      masteryMap
    );

    return {
      sentence,
      difficulty,
      fitScore,
      hasKanji: hasKanjiTokens(sentence),
      charCount: getCharacterCount(sentence),
    };
  });

  // Step 4: Sort by fit score
  scored.sort((a, b) => b.fitScore - a.fitScore);

  // Log top 5 candidates
  console.log("Top 5 candidates:");
  scored.slice(0, 5).forEach((s, i) => {
    const text = s.sentence.tokens.map(t => t.surface).join("");
    console.log(`  ${i+1}. [${s.sentence.id}] diff=${s.difficulty.toFixed(2)} fit=${s.fitScore.toFixed(2)} kanji=${s.hasKanji} "${text.slice(0, 20)}..."`);
  });

  // Step 5: Selection strategy based on user level
  const roll = Math.random();
  let selected: Sentence;
  let selectionReason: string;

  // For beginners (difficulty < 1.5), be conservative but varied
  if (targetDifficulty < 1.5) {
    // Pick randomly from top candidates, weighted toward better fits
    const topN = Math.min(5, scored.length);
    // Weighted random: 40% #1, 25% #2, 20% #3, 10% #4, 5% #5
    const weights = [0.4, 0.65, 0.85, 0.95, 1.0];
    let idx = 0;
    for (let i = 0; i < topN; i++) {
      if (roll < weights[i]) {
        idx = i;
        break;
      }
    }
    selected = scored[idx].sentence;
    selectionReason = `beginner mode, idx=${idx}`;
  }
  // For intermediate users
  else if (targetDifficulty < 2.5) {
    // 70% target, 20% easier, 10% slightly harder
    if (roll < 0.10) {
      // Probe: pick from slightly harder (but still filtered!)
      const harder = scored.filter((s) => s.difficulty > targetDifficulty);
      if (harder.length > 0) {
        selected = harder[Math.floor(Math.random() * Math.min(3, harder.length))].sentence;
        selectionReason = "intermediate probe (harder)";
      } else {
        selected = scored[0].sentence;
        selectionReason = "intermediate probe fallback";
      }
    } else if (roll < 0.30) {
      // Comfort: pick from easier
      const easier = scored.filter((s) => s.difficulty < targetDifficulty * 0.9);
      if (easier.length > 0) {
        selected = easier[Math.floor(Math.random() * Math.min(3, easier.length))].sentence;
        selectionReason = "intermediate comfort (easier)";
      } else {
        selected = scored[0].sentence;
        selectionReason = "intermediate comfort fallback";
      }
    } else {
      // Default: best fit from top 5
      const topN = Math.min(5, scored.length);
      selected = scored[Math.floor(Math.random() * topN)].sentence;
      selectionReason = "intermediate target";
    }
  }
  // For advanced users - more variety
  else {
    if (roll < 0.15) {
      // Probe harder
      const harder = scored.filter((s) => s.difficulty > targetDifficulty * 1.2);
      if (harder.length > 0) {
        selected = harder[Math.floor(Math.random() * Math.min(3, harder.length))].sentence;
        selectionReason = "advanced probe";
      } else {
        selected = scored[0].sentence;
        selectionReason = "advanced probe fallback";
      }
    } else if (roll < 0.35) {
      // Comfort zone
      const easier = scored.filter((s) => s.difficulty < targetDifficulty * 0.8);
      if (easier.length > 0) {
        selected = easier[Math.floor(Math.random() * Math.min(3, easier.length))].sentence;
        selectionReason = "advanced comfort";
      } else {
        selected = scored[0].sentence;
        selectionReason = "advanced comfort fallback";
      }
    } else {
      // Default: pick from top matches
      const topN = Math.min(5, scored.length);
      selected = scored[Math.floor(Math.random() * topN)].sentence;
      selectionReason = "advanced target";
    }
  }

  // Never repeat the very last sentence (recentIds[0] is most recent)
  if (recentIds.length > 0 && selected.id === recentIds[0] && scored.length > 1) {
    // Pick the next best option instead
    const nextBest = scored.find(s => s.sentence.id !== recentIds[0]);
    if (nextBest) {
      selected = nextBest.sentence;
      selectionReason += " (avoided repeat)";
    }
  }

  const selectedText = selected.tokens.map(t => t.surface).join("");
  console.log(`SELECTED: [${selected.id}] "${selectedText}" (${selectionReason})`);
  console.log("=========================\n");

  return selected;
}

// ============================================
// Difficulty Adjustment
// ============================================

/**
 * Adjust user's difficulty level based on sentence performance
 * Returns updated profile values
 */
export function adjustDifficulty(
  profile: UserProfile,
  result: SentenceResult
): Partial<UserProfile> {
  const {accuracy, avgTimeMs, hintsUsed, hadErrors} = result;

  let consecutivePerfect = profile.consecutive_perfect;
  let consecutiveStruggle = profile.consecutive_struggle;
  let currentDifficulty = profile.current_difficulty;

  // Crushing it: high accuracy, fast, no hints
  const isCrushingIt =
    accuracy >= 0.95 &&
    avgTimeMs < profile.speed_baseline_ms * 0.9 &&
    hintsUsed === 0 &&
    !hadErrors;

  // Struggling: low accuracy or had errors
  const isStruggling = accuracy < 0.7 || hadErrors;

  if (isCrushingIt) {
    consecutivePerfect++;
    consecutiveStruggle = 0;

    // Increase difficulty after 5 consecutive perfect sentences (more conservative)
    if (consecutivePerfect >= 5) {
      currentDifficulty *= 1.08; // +8% (smaller increment)
      consecutivePerfect = 0;
    }
  } else if (isStruggling) {
    consecutiveStruggle++;
    consecutivePerfect = 0;

    // Decrease difficulty after 2 consecutive struggling sentences
    if (consecutiveStruggle >= 2) {
      currentDifficulty *= 0.90; // -10%
      consecutiveStruggle = 0;
    }
  } else {
    // Normal performance
    consecutivePerfect = 0;
    consecutiveStruggle = 0;

    // Very slight increase if doing well
    if (accuracy >= 0.9 && avgTimeMs < profile.speed_baseline_ms) {
      currentDifficulty *= 1.01; // +1%
    }
  }

  // Clamp difficulty to valid range (slower progression)
  currentDifficulty = Math.max(0.8, Math.min(5.0, currentDifficulty));

  return {
    current_difficulty: currentDifficulty,
    consecutive_perfect: consecutivePerfect,
    consecutive_struggle: consecutiveStruggle,
  };
}

/**
 * Update user's speed baseline based on recent performance
 */
export function updateSpeedBaseline(
  currentBaseline: number,
  recentAvgTimeMs: number
): number {
  // Exponential moving average: 80% old, 20% new
  const newBaseline = currentBaseline * 0.8 + recentAvgTimeMs * 0.2;

  // Clamp to reasonable range (200ms - 3000ms)
  return Math.max(200, Math.min(3000, newBaseline));
}

/**
 * Calculate overall skill from all character masteries
 */
export function calculateOverallSkill(
  masteryMap: Map<string, CharacterMasteryData>
): number {
  if (masteryMap.size === 0) return 0;

  let totalScore = 0;
  let count = 0;

  for (const mastery of masteryMap.values()) {
    // Only count characters with enough attempts
    if (mastery.correct + mastery.incorrect >= 3) {
      totalScore += mastery.masteryScore;
      count++;
    }
  }

  return count > 0 ? totalScore / count : 0;
}
