<script lang="ts">
  import {m} from "$lib/paraglide/messages.js";
  import {toggleMode} from "mode-watcher";
  import Sun from "@lucide/svelte/icons/sun";
  import Moon from "@lucide/svelte/icons/moon";

  interface Props {
    mobile?: boolean;
  }

  let {mobile = false}: Props = $props();
</script>

{#if mobile}
  <button
    type="button"
    onclick={toggleMode}
    class="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-lg transition-colors duration-150 active:bg-muted/80"
  >
    <Sun
      class="h-6 w-6 scale-100 rotate-0 transition-transform duration-200 dark:scale-0 dark:-rotate-90"
    />
    <Moon
      class="absolute h-6 w-6 scale-0 rotate-90 transition-transform duration-200 dark:scale-100 dark:rotate-0"
    />
    <span class="sr-only">{m.theme_toggle()}</span>
  </button>
{:else}
  <button
    type="button"
    onclick={toggleMode}
    class="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
  >
    <Sun
      class="h-3.5 w-3.5 scale-100 rotate-0 transition-transform duration-200 dark:scale-0 dark:-rotate-90"
    />
    <Moon
      class="absolute h-3.5 w-3.5 scale-0 rotate-90 transition-transform duration-200 dark:scale-100 dark:rotate-0"
    />
    <span class="sr-only">{m.theme_toggle()}</span>
  </button>
{/if}
