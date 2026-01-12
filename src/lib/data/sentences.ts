export interface SentenceToken {
  surface: string; // What's displayed (could be kanji)
  reading: string; // Hiragana reading
  isKanji: boolean; // Whether it needs a hint
}

export interface Sentence {
  id: string;
  tokens: SentenceToken[];
  difficulty: number; // 1-5 scale
  jlpt?: string; // N5, N4, etc.
}

// Initial set of practice sentences
// In production, this would be loaded from a larger JSON file
export const sentences: Sentence[] = [
  // Very basic - hiragana only
  {
    id: "1",
    tokens: [
      {surface: "あ", reading: "あ", isKanji: false},
      {surface: "い", reading: "い", isKanji: false},
      {surface: "う", reading: "う", isKanji: false},
      {surface: "え", reading: "え", isKanji: false},
      {surface: "お", reading: "お", isKanji: false},
    ],
    difficulty: 1,
  },
  {
    id: "2",
    tokens: [
      {surface: "か", reading: "か", isKanji: false},
      {surface: "き", reading: "き", isKanji: false},
      {surface: "く", reading: "く", isKanji: false},
      {surface: "け", reading: "け", isKanji: false},
      {surface: "こ", reading: "こ", isKanji: false},
    ],
    difficulty: 1,
  },
  {
    id: "3",
    tokens: [
      {surface: "さ", reading: "さ", isKanji: false},
      {surface: "し", reading: "し", isKanji: false},
      {surface: "す", reading: "す", isKanji: false},
      {surface: "せ", reading: "せ", isKanji: false},
      {surface: "そ", reading: "そ", isKanji: false},
    ],
    difficulty: 1,
  },
  {
    id: "4",
    tokens: [
      {surface: "た", reading: "た", isKanji: false},
      {surface: "ち", reading: "ち", isKanji: false},
      {surface: "つ", reading: "つ", isKanji: false},
      {surface: "て", reading: "て", isKanji: false},
      {surface: "と", reading: "と", isKanji: false},
    ],
    difficulty: 1,
  },
  {
    id: "5",
    tokens: [
      {surface: "な", reading: "な", isKanji: false},
      {surface: "に", reading: "に", isKanji: false},
      {surface: "ぬ", reading: "ぬ", isKanji: false},
      {surface: "ね", reading: "ね", isKanji: false},
      {surface: "の", reading: "の", isKanji: false},
    ],
    difficulty: 1,
  },
  // Simple words - hiragana
  {
    id: "6",
    tokens: [
      {surface: "こ", reading: "こ", isKanji: false},
      {surface: "ん", reading: "ん", isKanji: false},
      {surface: "に", reading: "に", isKanji: false},
      {surface: "ち", reading: "ち", isKanji: false},
      {surface: "は", reading: "は", isKanji: false},
    ],
    difficulty: 1,
  },
  {
    id: "7",
    tokens: [
      {surface: "あ", reading: "あ", isKanji: false},
      {surface: "り", reading: "り", isKanji: false},
      {surface: "が", reading: "が", isKanji: false},
      {surface: "と", reading: "と", isKanji: false},
      {surface: "う", reading: "う", isKanji: false},
    ],
    difficulty: 1,
  },
  {
    id: "8",
    tokens: [
      {surface: "お", reading: "お", isKanji: false},
      {surface: "は", reading: "は", isKanji: false},
      {surface: "よ", reading: "よ", isKanji: false},
      {surface: "う", reading: "う", isKanji: false},
    ],
    difficulty: 1,
  },
  // Katakana practice
  {
    id: "9",
    tokens: [
      {surface: "ア", reading: "ア", isKanji: false},
      {surface: "イ", reading: "イ", isKanji: false},
      {surface: "ウ", reading: "ウ", isKanji: false},
      {surface: "エ", reading: "エ", isKanji: false},
      {surface: "オ", reading: "オ", isKanji: false},
    ],
    difficulty: 1.5,
  },
  {
    id: "10",
    tokens: [
      {surface: "コ", reading: "コ", isKanji: false},
      {surface: "ー", reading: "ー", isKanji: false},
      {surface: "ヒ", reading: "ヒ", isKanji: false},
      {surface: "ー", reading: "ー", isKanji: false},
    ],
    difficulty: 1.5,
  },
  // Simple sentences with kanji
  {
    id: "11",
    tokens: [
      {surface: "今日", reading: "きょう", isKanji: true},
      {surface: "は", reading: "は", isKanji: false},
      {surface: "いい", reading: "いい", isKanji: false},
      {surface: "天気", reading: "てんき", isKanji: true},
      {surface: "です", reading: "です", isKanji: false},
      {surface: "。", reading: "。", isKanji: false},
    ],
    difficulty: 2,
    jlpt: "N5",
  },
  {
    id: "12",
    tokens: [
      {surface: "私", reading: "わたし", isKanji: true},
      {surface: "は", reading: "は", isKanji: false},
      {surface: "学生", reading: "がくせい", isKanji: true},
      {surface: "です", reading: "です", isKanji: false},
      {surface: "。", reading: "。", isKanji: false},
    ],
    difficulty: 2,
    jlpt: "N5",
  },
  {
    id: "13",
    tokens: [
      {surface: "日本語", reading: "にほんご", isKanji: true},
      {surface: "を", reading: "を", isKanji: false},
      {surface: "勉強", reading: "べんきょう", isKanji: true},
      {surface: "し", reading: "し", isKanji: false},
      {surface: "て", reading: "て", isKanji: false},
      {surface: "います", reading: "います", isKanji: false},
      {surface: "。", reading: "。", isKanji: false},
    ],
    difficulty: 2.5,
    jlpt: "N5",
  },
  {
    id: "14",
    tokens: [
      {surface: "お", reading: "お", isKanji: false},
      {surface: "名前", reading: "なまえ", isKanji: true},
      {surface: "は", reading: "は", isKanji: false},
      {surface: "何", reading: "なん", isKanji: true},
      {surface: "です", reading: "です", isKanji: false},
      {surface: "か", reading: "か", isKanji: false},
      {surface: "？", reading: "？", isKanji: false},
    ],
    difficulty: 2,
    jlpt: "N5",
  },
  {
    id: "15",
    tokens: [
      {surface: "これ", reading: "これ", isKanji: false},
      {surface: "は", reading: "は", isKanji: false},
      {surface: "本", reading: "ほん", isKanji: true},
      {surface: "です", reading: "です", isKanji: false},
      {surface: "。", reading: "。", isKanji: false},
    ],
    difficulty: 2,
    jlpt: "N5",
  },
  // More complex sentences
  {
    id: "16",
    tokens: [
      {surface: "明日", reading: "あした", isKanji: true},
      {surface: "は", reading: "は", isKanji: false},
      {surface: "学校", reading: "がっこう", isKanji: true},
      {surface: "に", reading: "に", isKanji: false},
      {surface: "行", reading: "い", isKanji: true},
      {surface: "きます", reading: "きます", isKanji: false},
      {surface: "。", reading: "。", isKanji: false},
    ],
    difficulty: 2.5,
    jlpt: "N5",
  },
  {
    id: "17",
    tokens: [
      {surface: "毎日", reading: "まいにち", isKanji: true},
      {surface: "日本語", reading: "にほんご", isKanji: true},
      {surface: "を", reading: "を", isKanji: false},
      {surface: "練習", reading: "れんしゅう", isKanji: true},
      {surface: "し", reading: "し", isKanji: false},
      {surface: "ます", reading: "ます", isKanji: false},
      {surface: "。", reading: "。", isKanji: false},
    ],
    difficulty: 3,
    jlpt: "N5",
  },
  {
    id: "18",
    tokens: [
      {surface: "食", reading: "た", isKanji: true},
      {surface: "べ", reading: "べ", isKanji: false},
      {surface: "物", reading: "もの", isKanji: true},
      {surface: "が", reading: "が", isKanji: false},
      {surface: "好", reading: "す", isKanji: true},
      {surface: "き", reading: "き", isKanji: false},
      {surface: "です", reading: "です", isKanji: false},
      {surface: "。", reading: "。", isKanji: false},
    ],
    difficulty: 2.5,
    jlpt: "N5",
  },
  {
    id: "19",
    tokens: [
      {surface: "電車", reading: "でんしゃ", isKanji: true},
      {surface: "で", reading: "で", isKanji: false},
      {surface: "会社", reading: "かいしゃ", isKanji: true},
      {surface: "に", reading: "に", isKanji: false},
      {surface: "行", reading: "い", isKanji: true},
      {surface: "きます", reading: "きます", isKanji: false},
      {surface: "。", reading: "。", isKanji: false},
    ],
    difficulty: 3,
    jlpt: "N5",
  },
  {
    id: "20",
    tokens: [
      {surface: "どこ", reading: "どこ", isKanji: false},
      {surface: "に", reading: "に", isKanji: false},
      {surface: "住", reading: "す", isKanji: true},
      {surface: "んで", reading: "んで", isKanji: false},
      {surface: "います", reading: "います", isKanji: false},
      {surface: "か", reading: "か", isKanji: false},
      {surface: "？", reading: "？", isKanji: false},
    ],
    difficulty: 2.5,
    jlpt: "N5",
  },
];

// Get a sentence appropriate for the user's current level
export function selectSentence(
  mastery: number, // 0-1, user's overall mastery
  recentIds: string[] = [] // IDs to avoid repeating
): Sentence {
  // Target difficulty based on mastery
  const targetDifficulty = 1 + mastery * 4; // 1-5 range

  // Filter out recent sentences
  const available = sentences.filter((s) => !recentIds.includes(s.id));
  if (available.length === 0) return sentences[0];

  // Sort by how close to target difficulty
  const sorted = [...available].sort(
    (a, b) =>
      Math.abs(a.difficulty - targetDifficulty) -
      Math.abs(b.difficulty - targetDifficulty)
  );

  // Pick from top 3 closest matches randomly
  const top = sorted.slice(0, Math.min(3, sorted.length));
  return top[Math.floor(Math.random() * top.length)];
}
