<script lang="ts">
  import {m} from "$lib/paraglide/messages.js";
  import {Button} from "$lib/components/ui/button";
  import DayStreakDisplay from "./DayStreakDisplay.svelte";
  import ModeToggle from "./ModeToggle.svelte";
  import {getIsMobile} from "$lib/stores/platform.svelte";

  interface Props {
    onStart: () => void;
    dayStreak?: number;
    practicedToday?: boolean;
    lastSession?: {
      accuracy: number;
      maxStreak: number;
    } | null;
  }

  let {
    onStart,
    dayStreak = 0,
    practicedToday = false,
    lastSession = null,
  }: Props = $props();

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

    {#if lastSession}
      <div class="flex flex-col items-center gap-2">
        <span class="text-muted-foreground text-xs font-medium">
          {m.start_stats_lastSession()}
        </span>
        <div class="flex gap-4 text-sm font-medium text-muted-foreground">
          <span>{m.start_stats_accuracy({accuracy: lastSession.accuracy})}</span>
          <span>{m.start_stats_streak({streak: lastSession.maxStreak})}</span>
        </div>
      </div>
    {/if}

    <Button variant="default" size="lg" class="h-11 px-8" onclick={onStart}>
      {m.start_button_primary()}
    </Button>
  </div>
</div>
