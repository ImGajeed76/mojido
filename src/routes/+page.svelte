<script lang="ts">
  import StartScreen from "$lib/components/StartScreen.svelte";
  import PracticeView from "$lib/components/PracticeView.svelte";
  import StatsView from "$lib/components/StatsView.svelte";
  import {startSession} from "$lib/stores/session.svelte";
  import {getDayStreak, hasPracticedToday, initUserProfile} from "$lib/db";
  import {onMount, onDestroy} from "svelte";

  type View = "start" | "practice" | "stats";
  let currentView = $state<View>("start");
  let dayStreak = $state(0);
  let practicedToday = $state(false);

  // Load streak on mount
  $effect(() => {
    loadStreak();
  });

  // Handle Android back button via history API
  function handlePopState() {
    if (currentView === "practice") {
      handleQuit();
    } else if (currentView === "stats") {
      handleStatsBack();
    }
  }

  onMount(() => {
    window.addEventListener("popstate", handlePopState);
  });

  onDestroy(() => {
    window.removeEventListener("popstate", handlePopState);
  });

  async function loadStreak() {
    const [streak, practiced] = await Promise.all([
      getDayStreak(),
      hasPracticedToday(),
    ]);
    dayStreak = streak;
    practicedToday = practiced;
  }

  async function handleStart() {
    // Ensure user profile exists for adaptive learning
    await initUserProfile();
    await startSession();
    // Push state so back button works
    history.pushState({view: "practice"}, "");
    currentView = "practice";
  }

  async function handleQuit() {
    await loadStreak();
    currentView = "start";
  }

  function handleViewStats() {
    history.pushState({view: "stats"}, "");
    currentView = "stats";
  }

  function handleStatsBack() {
    currentView = "start";
  }
</script>

{#if currentView === "start"}
  <StartScreen onStart={handleStart} onViewStats={handleViewStats} {dayStreak} {practicedToday} />
{:else if currentView === "practice"}
  <PracticeView onQuit={handleQuit} />
{:else if currentView === "stats"}
  <StatsView onBack={handleStatsBack} />
{/if}
