<script lang="ts">
  import {m} from "$lib/paraglide/messages.js";
  import Flame from "@lucide/svelte/icons/flame";

  interface Props {
    mastered: number;
    total: number;
    dayStreak: number;
    practicedToday: boolean;
  }

  let {mastered, total, dayStreak, practicedToday}: Props = $props();

  const progress = $derived(total > 0 ? (mastered / total) * 100 : 0);
  const progressPercent = $derived(Math.round(progress));
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <!-- Progress -->
  <div class="rounded-lg border bg-card p-4">
    <div class="flex items-baseline justify-between mb-2">
      <span class="text-sm font-medium">{m.stats_mastery_progress()}</span>
      <span class="text-sm font-medium tabular-nums">
        {mastered}<span class="text-muted-foreground">/{total}</span>
      </span>
    </div>

    <!-- Progress bar -->
    <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        class="h-full bg-primary transition-[width] duration-300"
        style="width: {progress}%"
      ></div>
    </div>
  </div>

  <!-- Day Streak -->
  {#if dayStreak > 0 || practicedToday}
    <div class="rounded-lg border bg-card p-4">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
          <Flame class="h-4 w-4 text-orange-500" />
        </div>
        <div>
          <div class="text-base font-semibold tabular-nums">{dayStreak} {m.streak_day_label()}</div>
        </div>
      </div>
    </div>
  {/if}
</div>
