<script lang="ts">
  import {page} from "$app/state";
  import {locales, localizeHref} from "$lib/paraglide/runtime";
  import {ModeWatcher} from "mode-watcher";
  import Titlebar from "$lib/components/Titlebar.svelte";
  import {initPlatform, getIsMobile} from "$lib/stores/platform.svelte";
  import {onMount} from "svelte";
  import "./layout.css";

  const {children} = $props();

  let isMobile = $state(false);

  onMount(async () => {
    await initPlatform();
    isMobile = getIsMobile();
  });
</script>

<ModeWatcher />
{#if !isMobile}
  <Titlebar />
{/if}
<div class="flex h-full flex-col" class:pt-8={!isMobile}>
  {@render children()}
</div>
<div style="display:none">
  {#each locales as locale}
    <a href={localizeHref(page.url.pathname, {locale})}>
      {locale}
    </a>
  {/each}
</div>
