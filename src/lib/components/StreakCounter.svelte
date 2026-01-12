<script lang="ts">
  import {m} from "$lib/paraglide/messages.js";
  import {cn} from "$lib/utils";
  import Flame from "@lucide/svelte/icons/flame";

  interface Props {
    streak: number;
  }

  let {streak}: Props = $props();

  let prevStreak = $state(0);
  let animating = $state(false);

  $effect(() => {
    if (streak > prevStreak && streak > 0) {
      animating = true;
      setTimeout(() => {
        animating = false;
      }, 200);
    }
    prevStreak = streak;
  });

  const flameClass = $derived(
    cn(
      "h-5 w-5 transition-colors duration-150",
      streak === 0 ? "text-muted-foreground" : "text-orange-500"
    )
  );
</script>

<div
  class="flex items-center gap-1.5 transition-transform duration-200"
  class:scale-110={animating}
  style="transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);"
  aria-label={m.practice_streak_label()}
>
  <Flame class={flameClass} />
  <span
    class="text-lg font-semibold tabular-nums transition-colors duration-150"
    class:text-foreground={streak > 0}
    class:text-muted-foreground={streak === 0}
  >
    {streak}
  </span>
</div>
