/**
 * Sentence Generation Script
 *
 * Downloads Tatoeba Japanese sentences and processes them into
 * the format needed by the app (with tokenization and readings).
 *
 * Usage: bunx axogen run generate
 */

// @ts-ignore - no types available
const Kuroshiro = require("kuroshiro").default;
// @ts-ignore - no types available
const KuromojiAnalyzer = require("kuroshiro-analyzer-kuromoji").default;
import { existsSync, createWriteStream } from "fs";
import { writeFile, unlink } from "fs/promises";
import { createInterface } from "readline";
import { createReadStream } from "fs";
// @ts-ignore - no types available
import unbzip2 from "unbzip2-stream";
import { pipeline } from "stream/promises";

const TATOEBA_URL =
  "https://downloads.tatoeba.org/exports/per_language/jpn/jpn_sentences.tsv.bz2";
const BZ2_PATH = "./jpn_sentences.tsv.bz2";
const TSV_PATH = "./jpn_sentences.tsv";
const OUTPUT_PATH = "./src/lib/data/sentences-generated.ts";

// Configuration
const MIN_LENGTH = 3; // Minimum characters
const MAX_LENGTH = 30; // Maximum characters
const TARGET_COUNT = 500; // How many sentences to process
const BATCH_SIZE = 50; // Process in batches for progress reporting

interface SentenceToken {
  surface: string;
  reading: string;
  isKanji: boolean;
}

interface Sentence {
  id: string;
  tokens: SentenceToken[];
  difficulty: number;
  jlpt?: string;
}

// Check if string contains kanji
function containsKanji(str: string): boolean {
  return /[\u4e00-\u9faf]/.test(str);
}

// Estimate difficulty based on sentence characteristics
function estimateDifficulty(sentence: string, tokens: SentenceToken[]): number {
  let difficulty = 1;

  // Length factor
  if (sentence.length > 15) difficulty += 0.5;
  if (sentence.length > 25) difficulty += 0.5;

  // Kanji factor
  const kanjiCount = tokens.filter((t) => t.isKanji).length;
  difficulty += kanjiCount * 0.3;

  // Cap at 5
  return Math.min(5, Math.max(1, difficulty));
}

// Filter for good sentences
function isGoodSentence(sentence: string): boolean {
  // Length check
  if (sentence.length < MIN_LENGTH || sentence.length > MAX_LENGTH) {
    return false;
  }

  // Must contain some Japanese characters
  if (!/[\u3040-\u9faf]/.test(sentence)) {
    return false;
  }

  // Skip sentences with unusual characters
  if (/[a-zA-Z0-9]/.test(sentence)) {
    return false;
  }

  // Skip sentences with too many punctuation
  const punctCount = (sentence.match(/[。、！？「」『』（）]/g) || []).length;
  if (punctCount > 4) {
    return false;
  }

  return true;
}

async function downloadFile(url: string, dest: string): Promise<void> {
  console.log(`Downloading ${url}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  const fileStream = createWriteStream(dest);
  const reader = response.body?.getReader();

  if (!reader) throw new Error("No response body");

  const contentLength = response.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  let downloaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    fileStream.write(value);
    downloaded += value.length;

    if (total > 0) {
      const percent = ((downloaded / total) * 100).toFixed(1);
      process.stdout.write(`\rDownloading: ${percent}%`);
    }
  }

  fileStream.close();
  console.log("\nDownload complete.");
}

async function decompressBz2(src: string, dest: string): Promise<void> {
  console.log("Decompressing...");

  await pipeline(
    createReadStream(src),
    unbzip2() as any,
    createWriteStream(dest)
  );

  console.log("Decompression complete.");
}

async function loadSentences(tsvPath: string): Promise<Map<string, string>> {
  console.log("Loading sentences...");

  const sentences = new Map<string, string>();
  const fileStream = createReadStream(tsvPath);
  const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    const [id, _lang, text] = line.split("\t");
    if (id && text && isGoodSentence(text)) {
      sentences.set(id, text);
    }
  }

  console.log(`Loaded ${sentences.size} good sentences.`);
  return sentences;
}

async function tokenizeSentence(
  kuroshiro: any,
  sentence: string
): Promise<SentenceToken[]> {
  // Get tokenized result with readings
  const result = await (kuroshiro as any)._analyzer.parse(sentence);

  const tokens: SentenceToken[] = [];

  for (const token of result) {
    const surface = token.surface_form;
    // Use reading if available, otherwise use surface
    let reading = token.reading || surface;

    // Convert katakana reading to hiragana
    reading = await kuroshiro.convert(reading, { to: "hiragana" });

    // Skip empty tokens
    if (!surface.trim()) continue;

    tokens.push({
      surface,
      reading,
      isKanji: containsKanji(surface),
    });
  }

  return tokens;
}

export async function generateSentences() {
  console.log("=== Mojido Sentence Generator ===\n");

  // Step 1: Download if needed
  if (!existsSync(BZ2_PATH)) {
    await downloadFile(TATOEBA_URL, BZ2_PATH);
  } else {
    console.log("Using cached bz2 file.");
  }

  // Step 2: Decompress if needed
  if (!existsSync(TSV_PATH)) {
    await decompressBz2(BZ2_PATH, TSV_PATH);
  } else {
    console.log("Using cached tsv file.");
  }

  // Step 3: Load and filter sentences
  const allSentences = await loadSentences(TSV_PATH);

  // Step 4: Initialize Kuroshiro
  console.log("Initializing Kuroshiro (this may take a moment)...");
  const kuroshiro = new Kuroshiro();
  await kuroshiro.init(new KuromojiAnalyzer());
  console.log("Kuroshiro ready.\n");

  // Step 5: Process sentences
  const sentenceEntries = Array.from(allSentences.entries());

  // Shuffle and take target count
  const shuffled = sentenceEntries.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, TARGET_COUNT);

  console.log(`Processing ${selected.length} sentences...\n`);

  const processed: Sentence[] = [];
  let errors = 0;

  for (let i = 0; i < selected.length; i++) {
    const [id, text] = selected[i];

    try {
      const tokens = await tokenizeSentence(kuroshiro, text);

      if (tokens.length > 0) {
        const sentence: Sentence = {
          id,
          tokens,
          difficulty: estimateDifficulty(text, tokens),
        };
        processed.push(sentence);
      }
    } catch (err) {
      errors++;
    }

    // Progress
    if ((i + 1) % BATCH_SIZE === 0 || i === selected.length - 1) {
      console.log(`Processed ${i + 1}/${selected.length} (${errors} errors)`);
    }
  }

  // Step 6: Sort by difficulty
  processed.sort((a, b) => a.difficulty - b.difficulty);

  // Step 7: Generate output file
  console.log(`\nGenerating output file with ${processed.length} sentences...`);

  const output = `// Auto-generated by axogen generate-sentences script
// Source: Tatoeba (CC BY 2.0 FR)
// Generated: ${new Date().toISOString()}

import type { Sentence } from "./sentences";

export const generatedSentences: Sentence[] = ${JSON.stringify(processed, null, 2)};
`;

  await writeFile(OUTPUT_PATH, output);
  console.log(`\nOutput written to: ${OUTPUT_PATH}`);

  // Cleanup
  console.log("\nCleaning up TSV file...");
  await unlink(TSV_PATH);

  console.log("\n=== Done! ===");
  console.log(`Generated ${processed.length} sentences.`);
  console.log(`Difficulty range: ${processed[0]?.difficulty.toFixed(1)} - ${processed[processed.length - 1]?.difficulty.toFixed(1)}`);
}
