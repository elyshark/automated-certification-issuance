<script lang="ts">
  import * as Chart from "$lib/components/ui/chart";
  import * as Card from "$lib/components/ui/card";
  import { scalePoint } from "d3-scale";
  import { Area, AreaChart } from "layerchart";
  import { curveNatural } from "d3-shape";

  interface LocationStat {
    locationCode: string;
    locationName: string;
    approved: number;
  }

  let { chartData }: { chartData: LocationStat[] } = $props();

  const chartConfig = {
    approved: { label: "Approved Trainings", color: "var(--chart-2)" },
  } satisfies Chart.ChartConfig;
</script>

<Card.Root class=" @5xl/main:col-span-2">
  <Card.Header>
    <Card.Title>Approved Trainings by Location</Card.Title>
    <Card.Description>
      <span class="hidden @[540px]/card:block">
        Overview of approved training records per terminal
      </span>
      <span class="@[540px]/card:hidden">Approvals per terminal</span>
    </Card.Description>
  </Card.Header>
  <Card.Content class="px-2 pt-4 sm:px-6 sm:pt-6">
    <Chart.Container config={chartConfig} class="aspect-auto h-62.5 w-full">
      {#if chartData.length > 0}
        <AreaChart
          legend
          data={chartData}
          x="locationCode"
          xScale={scalePoint()}
          series={[
            {
              key: "approved",
              label: "Approved",
              color: chartConfig.approved.color,
            },
          ]}
          seriesLayout="stack"
          props={{
            area: {
              curve: curveNatural,
              "fill-opacity": 0.4,
              line: { class: "stroke-1" },
              motion: "tween",
            },
            xAxis: {
              format: (v) => v,
            },
            yAxis: { format: () => "" },
          }}
        >
          {#snippet marks({ series, getAreaProps })}
            <defs>
              <linearGradient id="fillApproved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stop-color="var(--color-approved)" stop-opacity={1.0} />
                <stop offset="95%" stop-color="var(--color-approved)" stop-opacity={0.1} />
              </linearGradient>
            </defs>
            {#each series as s, i (s.key)}
              <Area {...getAreaProps(s, i)} fill="url(#fillApproved)" />
            {/each}
          {/snippet}
          {#snippet tooltip()}
            <Chart.Tooltip
              labelFormatter={(v) => {
                const point = chartData.find((d) => d.locationCode === v);
                return point ? point.locationName : v;
              }}
              indicator="line"
            />
          {/snippet}
        </AreaChart>
      {:else}
        <div class="flex h-full items-center justify-center text-sm text-muted-foreground">
          No data available
        </div>
      {/if}
    </Chart.Container>
  </Card.Content>
</Card.Root>
