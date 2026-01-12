<script lang="ts">
  import {m} from "$lib/paraglide/messages.js";
  import {scale, fade} from "svelte/transition";
  import CalendarCheck from "@lucide/svelte/icons/calendar-check";

  interface Props {
    streak: number;
    onDismiss: () => void;
  }

  let {streak, onDismiss}: Props = $props();

  // Auto-dismiss after animation
  $effect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 2500);

    return () => clearTimeout(timer);
  });

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onDismiss();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
  transition:fade={{duration: 150}}
  onclick={onDismiss}
>
  <div
    class="flex flex-col items-center gap-6 p-8"
    transition:scale={{duration: 300, start: 0.8}}
    style="transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);"
  >
    <!-- Animated icon -->
    <div class="relative">
      <div class="animate-streak-pulse">
        <CalendarCheck class="h-16 w-16 text-orange-600 dark:text-orange-500" />
      </div>
      <!-- Glow effect -->
      <div
        class="absolute inset-0 -z-10 animate-streak-glow rounded-full bg-orange-600/20 dark:bg-orange-500/20 blur-xl"
      ></div>
    </div>

    <!-- Streak number -->
    <div class="flex flex-col items-center gap-2">
      <span class="text-5xl font-bold tabular-nums text-foreground">
        {streak}
      </span>
      <span class="text-lg font-medium text-muted-foreground">
        {m.streak_day_celebration({count: streak})}
      </span>
    </div>

    <!-- Subtitle -->
    <p class="text-sm text-muted-foreground">
      {m.streak_keep_going()}
    </p>
  </div>
</div>

<style>
  @keyframes streak-pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.15);
    }
  }

  .animate-streak-pulse {
    animation: streak-pulse 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 2;
  }

  @keyframes streak-glow {
    0%,
    100% {
      opacity: 0.4;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.6);
    }
  }

  .animate-streak-glow {
    animation: streak-glow 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 2;
  }
</style>
