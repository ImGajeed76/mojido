<script lang="ts">
  import {scale} from "svelte/transition";
  import {m} from "$lib/paraglide/messages.js";

  interface Props {
    surface: string;
    reading: string;
    isKanji: boolean;
    status: "pending" | "current" | "correct" | "incorrect";
    showHint?: boolean;
    onToggleHint?: () => void;
  }

  let {
    surface,
    reading,
    isKanji,
    status,
    showHint = false,
    onToggleHint,
  }: Props = $props();

  function handleClick() {
    if (isKanji && onToggleHint) {
      onToggleHint();
    }
  }
</script>

<span
  class="inline-block transition-colors duration-150"
  class:text-muted-foreground={status === "pending"}
  class:text-foreground={status === "current"}
  class:text-green-600={status === "correct"}
  class:dark:text-green-500={status === "correct"}
  class:text-destructive={status === "incorrect"}
>
  {#if isKanji}
    <button
      type="button"
      class="border-muted-foreground/50 hover:border-foreground focus-visible:ring-ring relative min-h-[44px] cursor-pointer border-b border-dashed transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
      onclick={handleClick}
      aria-label={m.hint_show_reading({kanji: surface})}
      aria-expanded={showHint}
    >
      <span class="text-2xl">{surface}</span>
      {#if showHint}
        <span
          class="bg-popover text-muted-foreground absolute -top-7 left-1/2 -translate-x-1/2 rounded-md border px-2 py-1 text-xs whitespace-nowrap shadow-md"
          transition:scale={{duration: 150, start: 0.9}}
        >
          {reading}
        </span>
      {/if}
    </button>
  {:else}
    <span class="text-2xl">{surface}</span>
  {/if}
</span>
