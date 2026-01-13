<script lang="ts">
  import {m} from "$lib/paraglide/messages.js";
  import {Button} from "$lib/components/ui/button";
  import SentenceDisplay from "./SentenceDisplay.svelte";
  import TypingDisplay from "./TypingDisplay.svelte";
  import StreakCounter from "./StreakCounter.svelte";
  import StreakCelebration from "./StreakCelebration.svelte";
  import ModeToggle from "./ModeToggle.svelte";
  import {type Sentence, selectSentence} from "$lib/data/sentences";
  import {tokenize, matchRomaji, isPunctuation, type Token} from "$lib/utils/romaji";
  import {
    getSessionState,
    recordAttempt,
    endSession,
  } from "$lib/stores/session.svelte";
  import {recordSentenceCompleted, getDayStreak} from "$lib/db";
  import {getIsMobile} from "$lib/stores/platform.svelte";

  interface Props {
    onQuit: () => void;
  }

  let {onQuit}: Props = $props();

  const isMobile = $derived(getIsMobile());

  const session = getSessionState();

  // Sentence state
  let currentSentence = $state<Sentence | null>(null);
  let recentSentenceIds = $state<string[]>([]);

  // Token-based tracking
  let currentTokenIndex = $state(0);
  let tokenRomajiList = $state<Token[][]>([]); // Romaji tokens for each sentence token
  let currentKanaIndex = $state(0); // Which kana within current token

  // Input state
  let inputBuffer = $state(""); // Current typing for this kana
  let hasError = $state(false);

  // Completed tokens
  let completedTokens = $state<{romaji: string; hadError: boolean}[]>([]);
  let tokenStatuses = $state<("pending" | "correct" | "incorrect")[]>([]);
  let currentTokenHadError = $state(false);

  // Hint state - only one hint open at a time
  let openHintIndex = $state<number | null>(null);

  // Day streak celebration
  let showCelebration = $state(false);
  let celebrationStreak = $state(0);

  let containerElement: HTMLDivElement | null = $state(null);
  let hiddenInputElement: HTMLInputElement | null = $state(null);

  // Initialize with first sentence
  $effect(() => {
    if (!currentSentence) {
      loadNextSentence();
    }
  });

  // Focus container on mount (or hidden input on mobile)
  $effect(() => {
    if (isMobile && hiddenInputElement) {
      hiddenInputElement.focus();
    } else if (containerElement) {
      containerElement.focus();
    }
  });

  function focusInput() {
    if (isMobile && hiddenInputElement) {
      hiddenInputElement.focus();
    } else if (containerElement) {
      containerElement.focus();
    }
  }

  // Handle mobile text input
  function handleMobileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const value = input.value;

    if (value.length === 0) {
      // Backspace was pressed
      if (inputBuffer.length > 0) {
        inputBuffer = inputBuffer.slice(0, -1);
        hasError = false;
      }
      return;
    }

    // Get the last typed character
    const typed = value.slice(-1).toLowerCase();
    input.value = ""; // Clear input immediately

    // Block input if there's an error
    if (hasError) return;

    const newInput = inputBuffer + typed;

    // Get current kana tokens
    const kanaTokens = getCurrentKanaTokens();
    if (kanaTokens.length === 0) return;

    // Validate using matchRomaji
    const result = matchRomaji(kanaTokens, currentKanaIndex, newInput);

    if (result.matched) {
      inputBuffer = newInput;
      const token = currentSentence!.tokens[currentTokenIndex];
      recordAttempt(token.reading, true);
      advanceToNext(newInput);
    } else if (result.partial) {
      inputBuffer = newInput;
    } else {
      inputBuffer = newInput;
      hasError = true;
      currentTokenHadError = true;
      const token = currentSentence!.tokens[currentTokenIndex];
      recordAttempt(token.reading, false);
    }
  }

  function handleMobileKeyDown(e: KeyboardEvent) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (inputBuffer.length > 0) {
        inputBuffer = inputBuffer.slice(0, -1);
        hasError = false;
      }
    }
  }

  function loadNextSentence() {
    const mastery =
      session.totalChars > 0 ? session.correctChars / session.totalChars : 0;
    const sentence = selectSentence(mastery, recentSentenceIds);
    currentSentence = sentence;

    // Track recent to avoid repetition
    recentSentenceIds = [...recentSentenceIds.slice(-5), sentence.id];

    // Build romaji tokens for each sentence token
    tokenRomajiList = sentence.tokens.map((token) => tokenize(token.reading));

    // Reset state
    currentTokenIndex = 0;
    currentKanaIndex = 0;
    inputBuffer = "";
    hasError = false;
    completedTokens = [];
    tokenStatuses = [];
    currentTokenHadError = false;
    openHintIndex = null; // Close any open hint on new sentence

    // Skip initial punctuation tokens
    skipPunctuationTokens();

    // Refocus
    setTimeout(() => focusInput(), 50);
  }

  // Skip any punctuation tokens (auto-complete them)
  function skipPunctuationTokens() {
    while (currentTokenIndex < tokenRomajiList.length) {
      const token = currentSentence!.tokens[currentTokenIndex];
      if (isPunctuation(token.reading)) {
        // Auto-complete this token (don't show in typed romaji, just mark as done)
        tokenStatuses = [...tokenStatuses, "correct"];
        currentTokenIndex++;
      } else {
        break;
      }
    }
  }

  function getCurrentKanaTokens(): Token[] {
    return tokenRomajiList[currentTokenIndex] || [];
  }

  // Toggle hint - only one can be open at a time
  function handleToggleHint(index: number) {
    if (openHintIndex === index) {
      openHintIndex = null; // Close if same hint clicked
    } else {
      openHintIndex = index; // Open new hint, closes previous
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Ignore modifier keys and special keys
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Escape") {
      handleQuit();
      return;
    }
    if (e.key === "Tab" || e.key === "Shift" || e.key === "Control") return;

    // Handle backspace
    if (e.key === "Backspace") {
      e.preventDefault();
      if (inputBuffer.length > 0) {
        inputBuffer = inputBuffer.slice(0, -1);
        hasError = false; // Clear error on backspace
      }
      return;
    }

    // Block input if there's an error
    if (hasError) {
      e.preventDefault();
      return;
    }

    // Only process single characters
    if (e.key.length !== 1) return;
    e.preventDefault();

    const typed = e.key.toLowerCase();
    const newInput = inputBuffer + typed;

    // Get current kana tokens
    const kanaTokens = getCurrentKanaTokens();
    if (kanaTokens.length === 0) return;

    // Validate using matchRomaji
    const result = matchRomaji(kanaTokens, currentKanaIndex, newInput);

    if (result.matched) {
      // Complete match for this kana - move to next
      inputBuffer = newInput;

      // Record attempt
      const token = currentSentence!.tokens[currentTokenIndex];
      recordAttempt(token.reading, true);

      // Move to next kana or token
      advanceToNext(newInput);
    } else if (result.partial) {
      // Partial match - keep typing
      inputBuffer = newInput;
    } else {
      // Error - wrong character
      inputBuffer = newInput;
      hasError = true;
      currentTokenHadError = true;

      // Record failed attempt
      const token = currentSentence!.tokens[currentTokenIndex];
      recordAttempt(token.reading, false);
    }
  }

  function advanceToNext(completedRomaji: string) {
    const kanaTokens = getCurrentKanaTokens();

    // Check if we've completed all kana in this token
    if (currentKanaIndex + 1 >= kanaTokens.length) {
      // Token complete - add to completed list
      completedTokens = [
        ...completedTokens,
        {romaji: buildTokenRomaji(), hadError: currentTokenHadError},
      ];
      tokenStatuses = [
        ...tokenStatuses,
        currentTokenHadError ? "incorrect" : "correct",
      ];

      // Close hint if it was open for the completed token
      if (openHintIndex === currentTokenIndex) {
        openHintIndex = null;
      }

      // Move to next token
      currentTokenIndex++;
      currentKanaIndex = 0;
      inputBuffer = "";
      currentTokenHadError = false;

      // Skip any punctuation tokens
      skipPunctuationTokens();

      // Check if sentence is complete
      if (currentTokenIndex >= tokenRomajiList.length) {
        openHintIndex = null; // Close any hint on sentence complete
        handleSentenceComplete();
      }
    } else {
      // Move to next kana within same token
      // Save the completed romaji for this kana
      currentKanaIndex++;
      inputBuffer = "";
    }
  }

  // Build the full romaji string for the current token (what's been typed)
  function buildTokenRomaji(): string {
    const kanaTokens = getCurrentKanaTokens();
    let romaji = "";
    for (let i = 0; i < kanaTokens.length; i++) {
      if (i < currentKanaIndex) {
        // Completed kana - use first romaji option
        romaji += kanaTokens[i].romaji[0] || kanaTokens[i].kana;
      } else if (i === currentKanaIndex) {
        // Current kana - use input buffer
        romaji += inputBuffer;
      }
    }
    return romaji;
  }

  async function handleSentenceComplete() {
    // Record sentence completion and check if it's first of the day
    const {isFirstToday} = await recordSentenceCompleted();

    if (isFirstToday) {
      // Show celebration for first sentence of the day
      celebrationStreak = await getDayStreak();
      showCelebration = true;
    } else {
      // Normal flow - load next sentence after brief delay
      setTimeout(() => {
        loadNextSentence();
      }, 600);
    }
  }

  function handleCelebrationDismiss() {
    showCelebration = false;
    // Load next sentence after celebration
    setTimeout(() => {
      loadNextSentence();
    }, 200);
  }

  async function handleQuit() {
    await endSession();
    onQuit();
  }

  // Calculate progress
  const totalKana = $derived(
    tokenRomajiList.reduce((sum, tokens) => sum + tokens.length, 0)
  );
  const completedKana = $derived.by(() => {
    let count = 0;
    for (let i = 0; i < currentTokenIndex; i++) {
      count += tokenRomajiList[i]?.length || 0;
    }
    count += currentKanaIndex;
    return count;
  });
  const progress = $derived(totalKana > 0 ? (completedKana / totalKana) * 100 : 0);

  // Build display romaji from completed tokens + current input
  const allCompletedTokens = $derived.by(() => {
    const result = [...completedTokens];
    // Add partial current token if we have input
    if (inputBuffer || currentKanaIndex > 0) {
      const partialRomaji = buildTokenRomaji();
      if (partialRomaji) {
        // Don't add as separate token, it's part of current typing
      }
    }
    return result;
  });

  const currentDisplayInput = $derived.by(() => {
    // Show all completed kana in current token + current input buffer
    const kanaTokens = getCurrentKanaTokens();
    let display = "";
    for (let i = 0; i < currentKanaIndex; i++) {
      display += kanaTokens[i]?.romaji[0] || kanaTokens[i]?.kana || "";
    }
    display += inputBuffer;
    return display;
  });
</script>

<!-- Hidden input for mobile keyboard -->
{#if isMobile}
  <input
    bind:this={hiddenInputElement}
    type="text"
    class="fixed bottom-0 left-0 h-0 w-0 opacity-0"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    enterkeyhint="next"
    oninput={handleMobileInput}
    onkeydown={handleMobileKeyDown}
  />
{/if}

<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions -->
<div
  bind:this={containerElement}
  class="flex h-full flex-col overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
  class:p-6={!isMobile}
  class:px-4={isMobile}
  class:pt-12={isMobile}
  class:pb-4={isMobile}
  tabindex="0"
  onkeydown={handleKeyDown}
  onclick={focusInput}
  role="application"
  aria-label="Typing practice area"
>
  <!-- Header - fixed height, won't shrink -->
  <div class="flex shrink-0 items-center justify-between">
    <StreakCounter streak={session.currentStreak} />
    {#if isMobile}
      <ModeToggle mobile />
    {:else}
      <Button variant="ghost" size="sm" onclick={handleQuit}>
        {m.practice_quit()}
      </Button>
    {/if}
  </div>

  <!-- Main practice area - fills remaining space, content centered -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="flex min-h-0 flex-1 flex-col items-center justify-center gap-6"
    class:gap-8={!isMobile}
    onclick={focusInput}
  >
    {#if currentSentence}
      <!-- Japanese sentence display -->
      <SentenceDisplay
        tokens={currentSentence.tokens}
        {currentTokenIndex}
        {tokenStatuses}
        {openHintIndex}
        onToggleHint={handleToggleHint}
      />

      <!-- Typed romaji display -->
      <TypingDisplay
        completedTokens={allCompletedTokens}
        currentInput={currentDisplayInput}
        {hasError}
      />

      <!-- Progress bar with organic easing -->
      <div class="h-1 w-full max-w-md overflow-hidden rounded-full bg-muted">
        <div
          class="h-full bg-primary transition-[width] duration-200"
          style="width: {progress}%; transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);"
        ></div>
      </div>
    {:else}
      <!-- Loading skeleton -->
      <div class="flex flex-col items-center gap-8">
        <div class="h-8 w-48 animate-pulse rounded bg-muted"></div>
        <div class="h-6 w-32 animate-pulse rounded bg-muted"></div>
        <div class="h-1 w-full max-w-md rounded-full bg-muted"></div>
      </div>
    {/if}
  </div>

  <!-- Session stats footer - fixed height, won't shrink -->
  <div class="flex shrink-0 justify-center gap-6 text-sm text-muted-foreground">
    <span>
      {m.practice_stats_correct({
        correct: session.correctChars,
        total: session.totalChars,
      })}
    </span>
    <span>
      {m.practice_stats_best_streak({streak: session.maxStreak})}
    </span>
  </div>
</div>

<!-- Day streak celebration overlay -->
{#if showCelebration}
  <StreakCelebration streak={celebrationStreak} onDismiss={handleCelebrationDismiss} />
{/if}
