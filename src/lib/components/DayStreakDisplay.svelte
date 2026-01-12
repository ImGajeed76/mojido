<script lang="ts">
  import {m} from "$lib/paraglide/messages.js";
  import {cn} from "$lib/utils";
  import CalendarCheck from "@lucide/svelte/icons/calendar-check";

  interface Props {
    streak: number;
    practicedToday?: boolean;
  }

  let {streak, practicedToday = false}: Props = $props();

  const iconClass = $derived(
    cn(
      "h-6 w-6 transition-colors duration-150",
      streak === 0
        ? "text-muted-foreground"
        : practicedToday
          ? "text-orange-600 dark:text-orange-500"
          : "text-orange-500 dark:text-orange-400"
    )
  );
</script>

<div class="flex flex-col items-center gap-2">
  <div class="flex items-center gap-2">
    <CalendarCheck class={iconClass} />
    <span
      class="text-3xl font-semibold tabular-nums transition-colors duration-150"
      class:text-foreground={streak > 0}
      class:text-muted-foreground={streak === 0}
    >
      {streak}
    </span>
  </div>
  <span class="text-muted-foreground text-xs font-medium">
    {m.streak_day_label()}
  </span>
</div>
