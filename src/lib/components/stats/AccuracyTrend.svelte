<script lang="ts">
  import {m} from "$lib/paraglide/messages.js";
  import {Chart, Svg, Area, Axis, Spline} from "layerchart";
  import {ChartContainer, type ChartConfig} from "$lib/components/ui/chart";
  import type {SessionSummary} from "$lib/db";
  import {scaleLinear, scalePoint} from "d3-scale";
  import TrendingUp from "@lucide/svelte/icons/trending-up";
  import TrendingDown from "@lucide/svelte/icons/trending-down";
  import Minus from "@lucide/svelte/icons/minus";

  interface Props {
    sessions: SessionSummary[];
  }

  let {sessions}: Props = $props();

  // Take last 10 sessions, reversed so oldest is first
  const chartData = $derived(
    [...sessions]
      .slice(0, 10)
      .reverse()
      .map((session, index) => ({
        index,
        accuracy: session.accuracy,
      }))
  );

  // Calculate trend
  const trend = $derived(() => {
    if (chartData.length < 2) return "neutral";
    const recent = chartData.slice(-3);
    const older = chartData.slice(0, 3);
    const recentAvg = recent.reduce((a, b) => a + b.accuracy, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b.accuracy, 0) / older.length;
    const diff = recentAvg - olderAvg;
    if (diff > 5) return "up";
    if (diff < -5) return "down";
    return "neutral";
  });

  const chartConfig: ChartConfig = {
    accuracy: {
      label: "Accuracy",
      color: "oklch(var(--primary))",
    },
  };
</script>

<div class="rounded-lg border bg-card p-4 h-full">
  <div class="flex items-center justify-between mb-3">
    <span class="text-sm font-medium">{m.stats_session_accuracy()}</span>
    {#if chartData.length >= 2}
      <div class="flex items-center gap-1 text-xs text-muted-foreground">
        {#if trend() === "up"}
          <TrendingUp class="h-3 w-3 text-green-600 dark:text-green-500" />
          <span class="text-green-600 dark:text-green-500">Improving</span>
        {:else if trend() === "down"}
          <TrendingDown class="h-3 w-3 text-destructive" />
          <span class="text-destructive">Declining</span>
        {:else}
          <Minus class="h-3 w-3" />
          <span>Steady</span>
        {/if}
      </div>
    {/if}
  </div>

  {#if chartData.length === 0}
    <div class="flex items-center justify-center h-20 text-xs text-muted-foreground">
      {m.stats_no_sessions()}
    </div>
  {:else if chartData.length === 1}
    <div class="flex items-center justify-center h-20">
      <div class="text-center">
        <div class="text-xl font-semibold tabular-nums">{chartData[0].accuracy}%</div>
        <div class="text-xs text-muted-foreground">First session</div>
      </div>
    </div>
  {:else}
    <ChartContainer config={chartConfig} class="h-24 w-full">
      <Chart
        data={chartData}
        x="index"
        xScale={scalePoint()}
        y="accuracy"
        yDomain={[0, 100]}
        yNice
        padding={{left: 28, bottom: 4, top: 4, right: 4}}
      >
        <Svg>
          <Axis placement="left" format={(d) => `${d}%`} ticks={3} />
          <Area
            fill="var(--color-accuracy)"
            fillOpacity={0.1}
            line={{stroke: "var(--color-accuracy)", strokeWidth: 2}}
          />
        </Svg>
      </Chart>
    </ChartContainer>
  {/if}
</div>
