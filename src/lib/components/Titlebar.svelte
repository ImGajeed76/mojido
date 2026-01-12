<script lang="ts">
  import {getCurrentWindow} from "@tauri-apps/api/window";
  import {cn} from "$lib/utils";
  import Minus from "@lucide/svelte/icons/minus";
  import Square from "@lucide/svelte/icons/square";
  import X from "@lucide/svelte/icons/x";
  import ModeToggle from "./ModeToggle.svelte";

  interface Props {
    class?: string;
  }

  let {class: className}: Props = $props();

  const appWindow = getCurrentWindow();

  async function startDrag() {
    await appWindow.startDragging();
  }

  async function minimize() {
    await appWindow.minimize();
  }

  async function toggleMaximize() {
    await appWindow.toggleMaximize();
  }

  async function close() {
    await appWindow.close();
  }
</script>

<div
  class={cn(
    "fixed top-0 right-0 left-0 z-50 flex h-8 select-none items-center",
    className
  )}
>
  <!-- Left controls -->
  <div class="flex shrink-0 items-center px-1">
    <ModeToggle />
  </div>

  <!-- Drag region (fills remaining space) -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="h-full flex-1 cursor-default"
    onmousedown={startDrag}
  ></div>

  <!-- Right controls (window buttons) -->
  <div class="flex shrink-0">
    <button
      type="button"
      class="flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
      onclick={minimize}
    >
      <Minus class="h-4 w-4" />
    </button>
    <button
      type="button"
      class="flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
      onclick={toggleMaximize}
    >
      <Square class="h-3 w-3" />
    </button>
    <button
      type="button"
      class="flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors duration-150 hover:bg-destructive hover:text-white"
      onclick={close}
    >
      <X class="h-4 w-4" />
    </button>
  </div>
</div>
