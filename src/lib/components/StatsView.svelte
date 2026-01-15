<script lang="ts">
  import {m} from "$lib/paraglide/messages.js";
  import {Button} from "$lib/components/ui/button";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ProgressSection from "./stats/ProgressSection.svelte";
  import FocusAreas from "./stats/FocusAreas.svelte";
  import AccuracyTrend from "./stats/AccuracyTrend.svelte";
  import MasterySection from "./stats/MasterySection.svelte";
  import {
    getUserProfile,
    getMasteryDistribution,
    getRecentSessions,
    getAllCharacterMastery,
    getDayStreak,
    getWeakCharacters,
    hasPracticedToday,
    type MasteryDistribution,
    type SessionSummary,
    type CharacterMasteryData,
  } from "$lib/db";

  interface Props {
    onBack: () => void;
  }

  let {onBack}: Props = $props();

  // Data state
  let distribution = $state<MasteryDistribution | null>(null);
  let sessions = $state<SessionSummary[]>([]);
  let masteryMap = $state<Map<string, CharacterMasteryData>>(new Map());
  let dayStreak = $state(0);
  let practicedToday = $state(false);
  let weakCharacters = $state<CharacterMasteryData[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Total kana characters
  const TOTAL_KANA = 142;

  // Load all data on mount
  $effect(() => {
    loadData();
  });

  async function loadData() {
    loading = true;
    error = null;
    try {
      const [d, s, masteryData, streak, practiced, weak] = await Promise.all([
        getMasteryDistribution(),
        getRecentSessions(10),
        getAllCharacterMastery(),
        getDayStreak(),
        hasPracticedToday(),
        getWeakCharacters(8, 3),
      ]);
      distribution = d;
      sessions = s;
      masteryMap = masteryData;
      dayStreak = streak;
      practicedToday = practiced;
      weakCharacters = weak;
    } catch (e) {
      console.error("Failed to load stats:", e);
      error = m.common_error();
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex h-full flex-col overflow-hidden">
  <!-- Header -->
  <div class="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6">
    <div class="mx-auto w-full max-w-md md:max-w-2xl">
      <div class="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          class="h-9 w-9"
          onclick={onBack}
          aria-label={m.common_back()}
        >
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <span class="text-base font-medium">{m.stats_page_title()}</span>
      </div>
    </div>
  </div>

  <!-- Scrollable content (scrollbar at edge) -->
  <div class="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
    <div class="mx-auto w-full max-w-md md:max-w-2xl">
      {#if loading}
        <!-- Loading skeleton -->
        <div class="space-y-6">
          <div class="h-32 animate-pulse rounded-lg bg-muted"></div>
          <div class="h-24 animate-pulse rounded-lg bg-muted"></div>
          <div class="h-48 animate-pulse rounded-lg bg-muted"></div>
        </div>
      {:else if error}
        <!-- Error state -->
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <p class="text-sm text-destructive mb-4">{error}</p>
          <Button variant="outline" size="sm" onclick={loadData}>
            {m.common_retry()}
          </Button>
        </div>
      {:else}
        <div class="space-y-4">
          <!-- Progress + Streak (side by side on desktop) -->
          <ProgressSection
            mastered={distribution?.mastered ?? 0}
            total={TOTAL_KANA}
            {dayStreak}
            {practicedToday}
          />

          <!-- Focus Areas + Accuracy Trend (side by side on desktop) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FocusAreas characters={weakCharacters} />
            <AccuracyTrend {sessions} />
          </div>

          <!-- Character Grid - collapsible detail view -->
          {#if distribution && distribution.total > 0}
            <MasterySection {distribution} {masteryMap} />
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
