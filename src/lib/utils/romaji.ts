// Hiragana to romaji mappings (with all valid alternatives)
const hiraganaToRomaji: Record<string, string[]> = {
  // Vowels
  あ: ["a"],
  い: ["i"],
  う: ["u"],
  え: ["e"],
  お: ["o"],

  // K-row
  か: ["ka"],
  き: ["ki"],
  く: ["ku"],
  け: ["ke"],
  こ: ["ko"],

  // S-row
  さ: ["sa"],
  し: ["si", "shi"],
  す: ["su"],
  せ: ["se"],
  そ: ["so"],

  // T-row
  た: ["ta"],
  ち: ["ti", "chi"],
  つ: ["tu", "tsu"],
  て: ["te"],
  と: ["to"],

  // N-row
  な: ["na"],
  に: ["ni"],
  ぬ: ["nu"],
  ね: ["ne"],
  の: ["no"],

  // H-row
  は: ["ha"],
  ひ: ["hi"],
  ふ: ["hu", "fu"],
  へ: ["he"],
  ほ: ["ho"],

  // M-row
  ま: ["ma"],
  み: ["mi"],
  む: ["mu"],
  め: ["me"],
  も: ["mo"],

  // Y-row
  や: ["ya"],
  ゆ: ["yu"],
  よ: ["yo"],

  // R-row
  ら: ["ra"],
  り: ["ri"],
  る: ["ru"],
  れ: ["re"],
  ろ: ["ro"],

  // W-row
  わ: ["wa"],
  を: ["wo", "o"],
  ん: ["n", "nn"],

  // Voiced consonants (G-row)
  が: ["ga"],
  ぎ: ["gi"],
  ぐ: ["gu"],
  げ: ["ge"],
  ご: ["go"],

  // Z-row
  ざ: ["za"],
  じ: ["ji", "zi"],
  ず: ["zu"],
  ぜ: ["ze"],
  ぞ: ["zo"],

  // D-row
  だ: ["da"],
  ぢ: ["di", "ji"],
  づ: ["du", "zu"],
  で: ["de"],
  ど: ["do"],

  // B-row
  ば: ["ba"],
  び: ["bi"],
  ぶ: ["bu"],
  べ: ["be"],
  ぼ: ["bo"],

  // P-row
  ぱ: ["pa"],
  ぴ: ["pi"],
  ぷ: ["pu"],
  ぺ: ["pe"],
  ぽ: ["po"],

  // Small kana (for combinations)
  ゃ: ["ya"],
  ゅ: ["yu"],
  ょ: ["yo"],
  ぁ: ["a"],
  ぃ: ["i"],
  ぅ: ["u"],
  ぇ: ["e"],
  ぉ: ["o"],

  // Combination sounds (きゃ, しゃ, etc.)
  きゃ: ["kya"],
  きゅ: ["kyu"],
  きょ: ["kyo"],
  しゃ: ["sha", "sya"],
  しゅ: ["shu", "syu"],
  しょ: ["sho", "syo"],
  ちゃ: ["cha", "tya"],
  ちゅ: ["chu", "tyu"],
  ちょ: ["cho", "tyo"],
  にゃ: ["nya"],
  にゅ: ["nyu"],
  にょ: ["nyo"],
  ひゃ: ["hya"],
  ひゅ: ["hyu"],
  ひょ: ["hyo"],
  みゃ: ["mya"],
  みゅ: ["myu"],
  みょ: ["myo"],
  りゃ: ["rya"],
  りゅ: ["ryu"],
  りょ: ["ryo"],
  ぎゃ: ["gya"],
  ぎゅ: ["gyu"],
  ぎょ: ["gyo"],
  じゃ: ["ja", "zya"],
  じゅ: ["ju", "zyu"],
  じょ: ["jo", "zyo"],
  びゃ: ["bya"],
  びゅ: ["byu"],
  びょ: ["byo"],
  ぴゃ: ["pya"],
  ぴゅ: ["pyu"],
  ぴょ: ["pyo"],

  // Small tsu (っ) - handled separately for doubling
  っ: ["xtu", "xtsu"],

  // Long vowel marker
  ー: ["-"],
};

// Katakana to hiragana mapping
const katakanaToHiragana: Record<string, string> = {
  ア: "あ",
  イ: "い",
  ウ: "う",
  エ: "え",
  オ: "お",
  カ: "か",
  キ: "き",
  ク: "く",
  ケ: "け",
  コ: "こ",
  サ: "さ",
  シ: "し",
  ス: "す",
  セ: "せ",
  ソ: "そ",
  タ: "た",
  チ: "ち",
  ツ: "つ",
  テ: "て",
  ト: "と",
  ナ: "な",
  ニ: "に",
  ヌ: "ぬ",
  ネ: "ね",
  ノ: "の",
  ハ: "は",
  ヒ: "ひ",
  フ: "ふ",
  ヘ: "へ",
  ホ: "ほ",
  マ: "ま",
  ミ: "み",
  ム: "む",
  メ: "め",
  モ: "も",
  ヤ: "や",
  ユ: "ゆ",
  ヨ: "よ",
  ラ: "ら",
  リ: "り",
  ル: "る",
  レ: "れ",
  ロ: "ろ",
  ワ: "わ",
  ヲ: "を",
  ン: "ん",
  ガ: "が",
  ギ: "ぎ",
  グ: "ぐ",
  ゲ: "げ",
  ゴ: "ご",
  ザ: "ざ",
  ジ: "じ",
  ズ: "ず",
  ゼ: "ぜ",
  ゾ: "ぞ",
  ダ: "だ",
  ヂ: "ぢ",
  ヅ: "づ",
  デ: "で",
  ド: "ど",
  バ: "ば",
  ビ: "び",
  ブ: "ぶ",
  ベ: "べ",
  ボ: "ぼ",
  パ: "ぱ",
  ピ: "ぴ",
  プ: "ぷ",
  ペ: "ぺ",
  ポ: "ぽ",
  ャ: "ゃ",
  ュ: "ゅ",
  ョ: "ょ",
  ァ: "ぁ",
  ィ: "ぃ",
  ゥ: "ぅ",
  ェ: "ぇ",
  ォ: "ぉ",
  ッ: "っ",
  ー: "ー",
};

// Katakana combinations
const katakanaCombinations: Record<string, string> = {
  キャ: "きゃ",
  キュ: "きゅ",
  キョ: "きょ",
  シャ: "しゃ",
  シュ: "しゅ",
  ショ: "しょ",
  チャ: "ちゃ",
  チュ: "ちゅ",
  チョ: "ちょ",
  ニャ: "にゃ",
  ニュ: "にゅ",
  ニョ: "にょ",
  ヒャ: "ひゃ",
  ヒュ: "ひゅ",
  ヒョ: "ひょ",
  ミャ: "みゃ",
  ミュ: "みゅ",
  ミョ: "みょ",
  リャ: "りゃ",
  リュ: "りゅ",
  リョ: "りょ",
  ギャ: "ぎゃ",
  ギュ: "ぎゅ",
  ギョ: "ぎょ",
  ジャ: "じゃ",
  ジュ: "じゅ",
  ジョ: "じょ",
  ビャ: "びゃ",
  ビュ: "びゅ",
  ビョ: "びょ",
  ピャ: "ぴゃ",
  ピュ: "ぴゅ",
  ピョ: "ぴょ",
};

function toHiragana(text: string): string {
  let result = "";
  let i = 0;
  while (i < text.length) {
    // Check for katakana combinations first (2 chars)
    if (i + 1 < text.length) {
      const combo = text.slice(i, i + 2);
      if (katakanaCombinations[combo]) {
        result += katakanaCombinations[combo];
        i += 2;
        continue;
      }
    }
    // Single katakana
    const char = text[i];
    result += katakanaToHiragana[char] ?? char;
    i++;
  }
  return result;
}

export interface Token {
  kana: string;
  romaji: string[];
  isSmallTsu: boolean;
}

export function tokenize(text: string): Token[] {
  const hiragana = toHiragana(text);
  const tokens: Token[] = [];
  let i = 0;

  while (i < hiragana.length) {
    // Check for combinations (2 chars like きゃ)
    if (i + 1 < hiragana.length) {
      const combo = hiragana.slice(i, i + 2);
      if (hiraganaToRomaji[combo]) {
        tokens.push({
          kana: combo,
          romaji: hiraganaToRomaji[combo],
          isSmallTsu: false,
        });
        i += 2;
        continue;
      }
    }

    // Single character
    const char = hiragana[i];
    const romaji = hiraganaToRomaji[char];

    if (char === "っ") {
      // Small tsu - next consonant gets doubled
      tokens.push({
        kana: char,
        romaji: [], // Will be determined by next character
        isSmallTsu: true,
      });
    } else if (romaji) {
      tokens.push({
        kana: char,
        romaji,
        isSmallTsu: false,
      });
    } else {
      // Non-kana character (punctuation, etc.)
      tokens.push({
        kana: char,
        romaji: [char],
        isSmallTsu: false,
      });
    }
    i++;
  }

  return tokens;
}

export interface MatchResult {
  matched: boolean;
  consumed: number;
  partial: boolean;
}

export function matchRomaji(
  tokens: Token[],
  tokenIndex: number,
  input: string
): MatchResult {
  if (tokenIndex >= tokens.length) {
    return {matched: false, consumed: 0, partial: false};
  }

  const token = tokens[tokenIndex];

  // Handle small tsu (っ) - doubles the next consonant
  if (token.isSmallTsu) {
    const nextToken = tokens[tokenIndex + 1];
    if (!nextToken) {
      // Small tsu at end - accept xtu/xtsu
      for (const r of ["xtu", "xtsu"]) {
        if (r.startsWith(input)) {
          if (input === r) {
            return {matched: true, consumed: r.length, partial: false};
          }
          return {matched: false, consumed: 0, partial: true};
        }
      }
      return {matched: false, consumed: 0, partial: false};
    }

    // Check if input matches doubled consonant pattern
    for (const nextRomaji of nextToken.romaji) {
      const firstConsonant = nextRomaji[0];
      const doubledPattern = firstConsonant + nextRomaji;

      if (doubledPattern.startsWith(input)) {
        if (input.length === 1 && input === firstConsonant) {
          // Just typed the doubled consonant for っ
          return {matched: true, consumed: 1, partial: false};
        }
        return {matched: false, consumed: 0, partial: true};
      }
    }

    // Also accept xtu/xtsu for explicit small tsu
    for (const r of ["xtu", "xtsu"]) {
      if (r.startsWith(input)) {
        if (input === r) {
          return {matched: true, consumed: r.length, partial: false};
        }
        return {matched: false, consumed: 0, partial: true};
      }
    }

    return {matched: false, consumed: 0, partial: false};
  }

  // Special handling for ん (n) - needs "nn" before vowels/y-sounds (but not n-sounds)
  // Before n-sounds (na, ni, etc.), single "n" is fine because typing naturally doubles
  // e.g., こんにちは = "konnichiwa" where "n" = ん, "ni" = に
  if (token.kana === "ん") {
    const nextToken = tokens[tokenIndex + 1];
    // Only require "nn" before vowels (あいうえお) and y-sounds (やゆよ)
    // NOT before n-sounds (なにぬねの) since natural typing handles it
    const needsDouble =
      nextToken && /^[あいうえおやゆよぁぃぅぇぉゃゅょ]/.test(nextToken.kana);

    if (needsDouble) {
      // Must use "nn" in this context to disambiguate
      if (input === "n") {
        return {matched: false, consumed: 0, partial: true}; // Wait for second n
      }
      if (input === "nn") {
        return {matched: true, consumed: 2, partial: false};
      }
      if ("nn".startsWith(input)) {
        return {matched: false, consumed: 0, partial: true};
      }
      return {matched: false, consumed: 0, partial: false};
    } else {
      // Can use either "n" or "nn"
      if (input === "n" || input === "nn") {
        return {matched: true, consumed: input.length, partial: false};
      }
      if ("nn".startsWith(input)) {
        return {matched: false, consumed: 0, partial: true};
      }
      return {matched: false, consumed: 0, partial: false};
    }
  }

  // Normal token matching
  for (const romaji of token.romaji) {
    if (romaji.startsWith(input)) {
      if (input === romaji) {
        return {matched: true, consumed: romaji.length, partial: false};
      }
      return {matched: false, consumed: 0, partial: true};
    }
    if (input.startsWith(romaji)) {
      return {matched: true, consumed: romaji.length, partial: false};
    }
  }

  return {matched: false, consumed: 0, partial: false};
}

// Special handling for ん (n) - needs double n before vowels
export function needsDoubleN(tokens: Token[], index: number): boolean {
  if (tokens[index]?.kana !== "ん") return false;
  const next = tokens[index + 1];
  if (!next) return false;
  // ん before a vowel or y-sounds needs nn
  const nextKana = next.kana;
  return /^[あいうえおやゆよ]/.test(nextKana);
}

// Check if a string is only punctuation (should be skipped during typing)
export function isPunctuation(text: string): boolean {
  return /^[。、！？「」『』（）・～…\s]+$/.test(text);
}
