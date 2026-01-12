<script lang="ts">
  interface CompletedToken {
    romaji: string;
    hadError: boolean;
  }

  interface Props {
    completedTokens: CompletedToken[];
    currentInput: string;
    hasError: boolean;
  }

  let {completedTokens, currentInput, hasError}: Props = $props();
</script>

<div
  class="flex flex-wrap justify-center font-mono text-xl tracking-wider min-h-[2rem]"
>
  <!-- Completed tokens -->
  {#each completedTokens as token, i (i)}
    <span
      class="transition-all duration-150 {token.hadError
        ? 'text-muted-foreground'
        : 'text-green-600/70 dark:text-green-500/70'}"
    >
      {token.romaji}
    </span>
  {/each}

  <!-- Current input with cursor -->
  <span class="relative inline-flex">
    {#each currentInput.split("") as char, i (i)}
      {@const isLastChar = i === currentInput.length - 1}
      <span
        class="transition-colors duration-75"
        class:text-foreground={!hasError || !isLastChar}
        class:text-destructive={hasError && isLastChar}
        class:animate-shake={hasError && isLastChar}
      >
        {char}
      </span>
    {/each}
    <!-- Elegant blinking cursor -->
    <span
      class="bg-primary ml-px inline-block h-[1.2em] w-[2px] translate-y-[0.1em] animate-blink"
    ></span>
  </span>
</div>

<style>
  @keyframes blink {
    0%,
    50% {
      opacity: 1;
    }
    51%,
    100% {
      opacity: 0;
    }
  }

  .animate-blink {
    animation: blink 1s step-end infinite;
  }

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    20%,
    60% {
      transform: translateX(-2px);
    }
    40%,
    80% {
      transform: translateX(2px);
    }
  }

  .animate-shake {
    animation: shake 0.3s ease-out;
  }
</style>
