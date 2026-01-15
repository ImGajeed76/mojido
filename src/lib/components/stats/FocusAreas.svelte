<script lang="ts">
  import {m} from "$lib/paraglide/messages.js";
  import type {CharacterMasteryData} from "$lib/db";

  interface Props {
    characters: CharacterMasteryData[];
  }

  let {characters}: Props = $props();

  // Format accuracy as percentage
  function formatAccuracy(accuracy: number): string {
    return `${Math.round(accuracy * 100)}%`;
  }

  // Get color class based on accuracy
  function getAccuracyColor(accuracy: number): string {
    if (accuracy < 0.5) return "text-destructive";
    if (accuracy < 0.7) return "text-yellow-600 dark:text-yellow-500";
    return "text-muted-foreground";
  }
</script>

<div class="rounded-lg border bg-card p-4 h-full">
  <div class="mb-3">
    <span class="text-sm font-medium">{m.stats_focus_areas()}</span>
    <p class="text-xs text-muted-foreground">{m.stats_focus_areas_desc()}</p>
  </div>

  {#if characters.length === 0}
    <p class="py-2 text-xs text-muted-foreground text-center">
      {m.stats_no_weak_chars()}
    </p>
  {:else}
    <div class="flex flex-wrap gap-2">
      {#each characters as char}
        <div class="flex flex-col items-center gap-0.5 rounded-md bg-muted/50 px-3 py-2">
          <span class="text-xl font-medium">{char.character}</span>
          <span class="text-xs font-medium tabular-nums {getAccuracyColor(char.accuracy)}">
            {formatAccuracy(char.accuracy)}
          </span>
        </div>
      {/each}
    </div>
  {/if}
</div>
