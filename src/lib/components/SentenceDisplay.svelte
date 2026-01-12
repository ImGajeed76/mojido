<script lang="ts">
  import type {SentenceToken} from "$lib/data/sentences";
  import HintToken from "./HintToken.svelte";

  interface Props {
    tokens: SentenceToken[];
    currentTokenIndex: number;
    tokenStatuses: ("pending" | "correct" | "incorrect")[];
    openHintIndex: number | null;
    onToggleHint: (index: number) => void;
  }

  let {
    tokens,
    currentTokenIndex,
    tokenStatuses,
    openHintIndex,
    onToggleHint,
  }: Props = $props();
</script>

<div class="flex flex-wrap items-center justify-center gap-1">
  {#each tokens as token, i}
    <HintToken
      surface={token.surface}
      reading={token.reading}
      isKanji={token.isKanji}
      status={i < currentTokenIndex
        ? tokenStatuses[i]
        : i === currentTokenIndex
          ? "current"
          : "pending"}
      showHint={openHintIndex === i}
      onToggleHint={() => onToggleHint(i)}
    />
  {/each}
</div>
