<script lang="ts">
  import {m} from "$lib/paraglide/messages.js";
  import {Button} from "$lib/components/ui/button";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import type {MasteryDistribution, CharacterMasteryData} from "$lib/db";

  interface Props {
    distribution: MasteryDistribution;
    masteryMap: Map<string, CharacterMasteryData>;
  }

  let {distribution, masteryMap}: Props = $props();

  let expanded = $state(false);

  // All hiragana characters in order
  const hiraganaRows = [
    ["あ", "い", "う", "え", "お"],
    ["か", "き", "く", "け", "こ"],
    ["さ", "し", "す", "せ", "そ"],
    ["た", "ち", "つ", "て", "と"],
    ["な", "に", "ぬ", "ね", "の"],
    ["は", "ひ", "ふ", "へ", "ほ"],
    ["ま", "み", "む", "め", "も"],
    ["や", "", "ゆ", "", "よ"],
    ["ら", "り", "る", "れ", "ろ"],
    ["わ", "", "を", "", "ん"],
  ];

  // Voiced consonants
  const voicedRows = [
    ["が", "ぎ", "ぐ", "げ", "ご"],
    ["ざ", "じ", "ず", "ぜ", "ぞ"],
    ["だ", "ぢ", "づ", "で", "ど"],
    ["ば", "び", "ぶ", "べ", "ぼ"],
    ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"],
  ];

  // All katakana characters in order
  const katakanaRows = [
    ["ア", "イ", "ウ", "エ", "オ"],
    ["カ", "キ", "ク", "ケ", "コ"],
    ["サ", "シ", "ス", "セ", "ソ"],
    ["タ", "チ", "ツ", "テ", "ト"],
    ["ナ", "ニ", "ヌ", "ネ", "ノ"],
    ["ハ", "ヒ", "フ", "ヘ", "ホ"],
    ["マ", "ミ", "ム", "メ", "モ"],
    ["ヤ", "", "ユ", "", "ヨ"],
    ["ラ", "リ", "ル", "レ", "ロ"],
    ["ワ", "", "ヲ", "", "ン"],
  ];

  // Get base color class based on mastery level
  function getLevelClass(char: string): string {
    const data = masteryMap.get(char);
    if (!data) return "text-muted-foreground bg-muted/50";

    switch (data.level) {
      case "mastered":
        return "text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-900/30";
      case "reviewing":
        return "text-blue-600 dark:text-blue-500 bg-blue-100 dark:bg-blue-900/30";
      case "learning":
        return "text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30";
      default:
        return "text-muted-foreground bg-muted/50";
    }
  }

  // Get accuracy-based opacity style
  function getAccuracyStyle(char: string): string {
    const data = masteryMap.get(char);
    if (!data) return "";

    // Scale opacity from 0.4 (low accuracy) to 1.0 (high accuracy)
    const opacity = 0.4 + data.accuracy * 0.6;
    return `opacity: ${opacity.toFixed(2)}`;
  }

  // Get tooltip text for character
  function getTooltip(char: string): string {
    const data = masteryMap.get(char);
    if (!data) return char;

    const accuracy = Math.round(data.accuracy * 100);
    const attempts = data.correct + data.incorrect;
    return `${char}: ${accuracy}% accuracy (${attempts} attempts)`;
  }
</script>

<div class="rounded-lg border bg-card">
  <!-- Header - always visible -->
  <button
    class="flex w-full items-center justify-between p-4 text-left"
    onclick={() => expanded = !expanded}
  >
    <div>
      <span class="text-sm font-medium">{m.stats_mastery_title()}</span>
      <!-- Mastery distribution badges -->
      <div class="flex flex-wrap gap-2 mt-1.5 text-xs">
        <div class="flex items-center gap-1">
          <span class="h-2 w-2 rounded-full bg-green-500"></span>
          <span class="text-muted-foreground">{distribution.mastered}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="h-2 w-2 rounded-full bg-blue-500"></span>
          <span class="text-muted-foreground">{distribution.reviewing}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="h-2 w-2 rounded-full bg-yellow-500"></span>
          <span class="text-muted-foreground">{distribution.learning}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="h-2 w-2 rounded-full bg-muted border border-muted-foreground/20"></span>
          <span class="text-muted-foreground">{distribution.new}</span>
        </div>
      </div>
    </div>
    <ChevronDown class="h-4 w-4 text-muted-foreground transition-transform duration-200 {expanded ? 'rotate-180' : ''}" />
  </button>

  <!-- Collapsible content -->
  {#if expanded}
  <div class="px-4 pb-4 space-y-3">
    <!-- Hiragana grid -->
  <div class="space-y-1">
    <span class="text-xs text-muted-foreground">{m.stats_hiragana()}</span>
    <div class="flex flex-wrap gap-0.5">
      {#each hiraganaRows as row}
        {#each row as char}
          {#if char}
            <div
              class="flex h-6 w-6 items-center justify-center rounded text-xs font-medium transition-[colors,opacity] duration-150 {getLevelClass(char)}"
              style={getAccuracyStyle(char)}
              title={getTooltip(char)}
            >
              {char}
            </div>
          {:else}
            <div class="h-6 w-6"></div>
          {/if}
        {/each}
      {/each}
    </div>
  </div>

  <!-- Voiced hiragana grid -->
  <div class="space-y-1">
    <span class="text-xs text-muted-foreground">{m.stats_voiced()}</span>
    <div class="flex flex-wrap gap-0.5">
      {#each voicedRows as row}
        {#each row as char}
          <div
            class="flex h-6 w-6 items-center justify-center rounded text-xs font-medium transition-[colors,opacity] duration-150 {getLevelClass(char)}"
            style={getAccuracyStyle(char)}
            title={getTooltip(char)}
          >
            {char}
          </div>
        {/each}
      {/each}
    </div>
  </div>

  <!-- Katakana grid -->
  <div class="space-y-1">
    <span class="text-xs text-muted-foreground">{m.stats_katakana()}</span>
    <div class="flex flex-wrap gap-0.5">
      {#each katakanaRows as row}
        {#each row as char}
          {#if char}
            <div
              class="flex h-6 w-6 items-center justify-center rounded text-xs font-medium transition-[colors,opacity] duration-150 {getLevelClass(char)}"
              style={getAccuracyStyle(char)}
              title={getTooltip(char)}
            >
              {char}
            </div>
          {:else}
            <div class="h-6 w-6"></div>
          {/if}
        {/each}
      {/each}
    </div>
  </div>
  </div>
  {/if}
</div>
