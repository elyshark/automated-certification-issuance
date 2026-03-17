<script lang="ts">
  import * as Chart from "$lib/components/ui/chart";
  import * as Card from "$lib/components/ui/card";
  import { PieChart, Text } from "layerchart";

  interface Props {
    valid: number;
    expiringSoon: number;
    expired: number;
  }

  let { valid = 0, expiringSoon = 0, expired = 0 }: Props = $props();

  const chartData = $derived(
    [
      { id: "status_valid", status: "Valid", count: valid, fill: "var(--chart-2)" },
      {
        id: "status_expiring_soon",
        status: "Expiring Soon",
        count: expiringSoon,
        fill: "var(--chart-4)",
      },
      {
        id: "status_expired",
        status: "Expired",
        count: expired,
        fill: "var(--chart-1)",
      },
    ].filter((d) => d.count > 0),
  );

  const totalCerts = $derived.by(() => {
    if (chartData.length === 0) return 0;
    return chartData.map((data) => data.count).reduce((prev, next) => prev + next);
  });

  const chartConfig = {
    count: { label: "Certificates" },
    status_valid: { label: "Valid", color: "var(--chart-2)" },
    status_expiring_soon: { label: "Expiring Soon", color: "var(--chart-4)" },
    status_expired: { label: "Expired", color: "var(--chart-1)" },
  } satisfies Chart.ChartConfig;
</script>

<Card.Root class="flex flex-col @5xl/main:col-span-1">
  <Card.Header class="items-center">
    <Card.Title>Training Validity</Card.Title>
    <Card.Description>Issued certificate statuses</Card.Description>
  </Card.Header>
  <Card.Content class="flex-1">
    <Chart.Container config={chartConfig} class="mx-auto aspect-square max-h-62.5">
      <PieChart
        data={chartData}
        key="id"
        value="count"
        c="fill"
        innerRadius={60}
        padding={28}
        props={{ pie: { motion: "tween" } }}
      >
        {#snippet aboveMarks()}
          <Text
            value={String(totalCerts)}
            textAnchor="middle"
            verticalAnchor="middle"
            class="fill-foreground text-3xl! font-bold"
            dy={3}
          />
          <Text
            value="Certificates"
            textAnchor="middle"
            verticalAnchor="middle"
            class="fill-muted-foreground! text-muted-foreground"
            dy={22}
          />
        {/snippet}
        {#snippet tooltip()}
          <Chart.Tooltip hideLabel />
        {/snippet}
      </PieChart>
    </Chart.Container>
  </Card.Content>
</Card.Root>
