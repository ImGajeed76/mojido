<script lang="ts">
  import {page} from "$app/state";
  import {locales, localizeHref} from "$lib/paraglide/runtime";
  import {ModeWatcher} from "mode-watcher";
  import Titlebar from "$lib/components/Titlebar.svelte";
  import "./layout.css";

  const {children} = $props();
</script>

<ModeWatcher />
<Titlebar />
<div class="flex h-full flex-col pt-8">
  {@render children()}
</div>
<div style="display:none">
  {#each locales as locale}
    <a href={localizeHref(page.url.pathname, {locale})}>
      {locale}
    </a>
  {/each}
</div>
