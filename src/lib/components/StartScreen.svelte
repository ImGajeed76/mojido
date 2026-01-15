<script lang="ts">
  import {m} from "$lib/paraglide/messages.js";
  import {Button} from "$lib/components/ui/button";
  import BarChart3 from "@lucide/svelte/icons/bar-chart-3";
  import DayStreakDisplay from "./DayStreakDisplay.svelte";
  import ModeToggle from "./ModeToggle.svelte";
  import {getIsMobile} from "$lib/stores/platform.svelte";

  interface Props {
    onStart: () => void;
    onViewStats: () => void;
    dayStreak?: number;
    practicedToday?: boolean;
  }

  let {onStart, onViewStats, dayStreak = 0, practicedToday = false}: Props = $props();

  const isMobile = $derived(getIsMobile());
</script>

<div
  class="relative flex h-full flex-col items-center justify-center"
  class:p-6={!isMobile}
  class:px-4={isMobile}
  class:pt-12={isMobile}
  class:pb-4={isMobile}
>
  <!-- Mobile theme toggle -->
  {#if isMobile}
    <div class="absolute top-12 right-4">
      <ModeToggle mobile />
    </div>
  {/if}
  <div class="flex flex-col items-center gap-8 text-center">
    <div class="flex flex-col items-center gap-2">
      <h1 class="text-3xl font-semibold tracking-tight">{m.start_title()}</h1>
      <p class="text-sm text-muted-foreground">{m.app_tagline()}</p>
    </div>

    <!-- Day Streak Display -->
    <DayStreakDisplay streak={dayStreak} {practicedToday} />

    <p class="text-muted-foreground max-w-sm text-sm leading-normal">
      {m.start_description()}
    </p>

    <!-- Action buttons: Start (wide) + Stats (square) -->
    <div class="flex items-center gap-2">
      <Button variant="default" size="lg" class="h-11 px-8" onclick={onStart}>
        {m.start_button_primary()}
      </Button>
      <Button
        variant="outline"
        size="icon"
        class="h-11 w-11"
        onclick={onViewStats}
        aria-label={m.stats_page_title()}
      >
        <BarChart3 class="h-5 w-5" />
      </Button>
    </div>
  </div>
</div>
