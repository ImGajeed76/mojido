<script lang="ts">
  import StartScreen from "$lib/components/StartScreen.svelte";
  import PracticeView from "$lib/components/PracticeView.svelte";
  import {startSession, loadLastSession} from "$lib/stores/session.svelte";
  import {getDayStreak, hasPracticedToday} from "$lib/db";

  type View = "start" | "practice";
  let currentView = $state<View>("start");
  let lastSession = $state<{accuracy: number; maxStreak: number} | null>(null);
  let dayStreak = $state(0);
  let practicedToday = $state(false);

  // Load stats on mount
  $effect(() => {
    loadStats();
  });

  async function loadStats() {
    const [session, streak, practiced] = await Promise.all([
      loadLastSession(),
      getDayStreak(),
      hasPracticedToday(),
    ]);
    lastSession = session;
    dayStreak = streak;
    practicedToday = practiced;
  }

  async function handleStart() {
    await startSession();
    currentView = "practice";
  }

  async function handleQuit() {
    // Reload all stats
    await loadStats();
    currentView = "start";
  }
</script>

{#if currentView === "start"}
  <StartScreen onStart={handleStart} {lastSession} {dayStreak} {practicedToday} />
{:else if currentView === "practice"}
  <PracticeView onQuit={handleQuit} />
{/if}
