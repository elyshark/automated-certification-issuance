<script lang="ts">
  import DashboardMap from "$lib/components/dashboard/dashboard-map.svelte";
  import * as Card from "$lib/components/ui/card";
  import * as Chart from "$lib/components/ui/chart";
  import { Button } from "$lib/components/ui/button";
  import TrainingRecordDrawer from "$lib/components/training-history/training-record-drawer.svelte";
  import { PieChart, Text } from "layerchart";
  import { resolve } from "$app/paths";

  let { data } = $props();

  const statusConfig = {
    pending: { label: "Pending", color: "var(--chart-4)" },
    approved: { label: "Approved", color: "var(--chart-2)" },
    rejected: { label: "Rejected", color: "var(--chart-1)" },
    count: { label: "Training Records" },
  } satisfies Chart.ChartConfig;

  const statusData = $derived.by(() =>
    [
      { id: "pending", status: "Pending", count: data.pendingCount, fill: "var(--chart-4)" },
      { id: "approved", status: "Approved", count: data.approvedCount, fill: "var(--chart-2)" },
      { id: "rejected", status: "Rejected", count: data.rejectedCount, fill: "var(--chart-1)" },
    ].filter((d) => d.count > 0),
  );

  const statusTotal = $derived.by(() => {
    if (statusData.length === 0) return 0;
    return statusData.map((item) => item.count).reduce((sum, next) => sum + next, 0);
  });

  type DrawerPayload = {
    record: null;
    employees: { id: number; name: string }[];
    trainings: { code: string; name: string }[];
    locations: { code: string; name: string }[];
    role: "USER" | "REVIEWER" | "ADMINISTRATOR";
    currentEmployeeId?: number;
    renewedFromId?: number | null;
  };

  let renewOpen = $state(false);
  let renewPayload = $state<DrawerPayload | null>(null);

  function openRenewal() {
    if (!data.nextTrainingHistoryId) return;
    renewPayload = {
      record: null,
      employees: data.employees,
      trainings: data.trainings,
      locations: data.locations,
      role: data.role,
      currentEmployeeId: data.currentId ?? undefined,
      renewedFromId: data.nextTrainingHistoryId,
    };
    renewOpen = true;
  }
</script>

<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
  <div class="grid auto-rows-min gap-4 md:grid-cols-3">
    <Card.Root class="flex h-full flex-col rounded-xl">
      <Card.Header class="pb-3">
        <Card.Title class="text-sm font-medium text-muted-foreground">
          Countdown till next expiry
        </Card.Title>
        <Card.Description>
          {#if data.nextExpiry !== null}
            {data.trainingCode} at {data.trainingLocation} by {data.traineeId === data.currentId
              ? "you"
              : data.traineeName}
          {:else}
            No upcoming renewals.
          {/if}
        </Card.Description>
      </Card.Header>
      <Card.Content class="flex-1">
        <div class="h-full text-5xl font-bold">
          {#if data.nextExpiry !== null}
            {data.nextExpiry} day{data.nextExpiry > 1 ? "s" : ""}
          {:else}
            --
          {/if}
        </div>
      </Card.Content>
      {#if data.nextExpiry !== null}
        <Card.Footer>
          {#if data.traineeId === data.currentId}
            <Button variant="destructive" size="sm" onclick={openRenewal}>Renew training</Button>
          {:else}
            <form method="POST" action="?/sendReminder">
              <input
                type="hidden"
                name="trainingHistoryId"
                value={data.nextTrainingHistoryId ?? ""}
              />
              <input type="hidden" name="traineeId" value={data.traineeId ?? ""} />
              <Button variant="default" size="sm" type="submit">Send reminder</Button>
            </form>
          {/if}
        </Card.Footer>
      {/if}
    </Card.Root>
    <Card.Root class="flex h-full flex-col rounded-xl">
      <Card.Header class="pb-3">
        <Card.Title class="text-sm font-medium text-muted-foreground">Your open actions</Card.Title>
        <Card.Description>Triage items that keep your certifications moving.</Card.Description>
      </Card.Header>
      <Card.Content class="text-md grid flex-1">
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-2 text-muted-foreground">
            <span class="inline-block h-2.5 w-2.5 rounded-full bg-blue-500"></span>
            Pending approvals
          </span>
          <span class="text-base font-semibold text-foreground">{data.pendingCount}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-2 text-muted-foreground">
            <span class="inline-block h-2.5 w-2.5 rounded-full bg-red-500"></span>
            Rejected trainings
          </span>
          <span class="text-base font-semibold text-foreground">{data.rejectedCount}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-2 text-muted-foreground">
            <span class="inline-block h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            Rejected with remarks
          </span>
          <span class="text-base font-semibold text-foreground">{data.rejectedWithRemarks}</span>
        </div>
      </Card.Content>
      <Card.Footer>
        <Button variant="outline" size="sm" href={resolve("/dashboard/training-history")}>
          View training history
        </Button>
      </Card.Footer>
    </Card.Root>
    <Card.Root class="flex h-full flex-col rounded-xl">
      <Card.Header class="pb-3">
        <Card.Title class="text-sm font-medium text-muted-foreground">
          Training status mix
        </Card.Title>
        <Card.Description>Approved, pending, and rejected across your scope.</Card.Description>
      </Card.Header>
      <Card.Content class="flex flex-1 flex-col items-center justify-center gap-2">
        {#if statusData.length > 0}
          <Chart.Container config={statusConfig} class="mx-auto aspect-square max-h-36 w-full">
            <PieChart
              data={statusData}
              key="id"
              value="count"
              c="fill"
              innerRadius={32}
              padding={12}
              props={{ pie: { motion: "tween" } }}
            >
              {#snippet aboveMarks()}
                <Text
                  value={String(statusTotal)}
                  textAnchor="middle"
                  verticalAnchor="middle"
                  class="fill-foreground text-lg! font-semibold"
                  dy={2}
                />
              {/snippet}
              {#snippet tooltip()}
                <Chart.Tooltip />
              {/snippet}
            </PieChart>
          </Chart.Container>
        {:else}
          <p class="text-sm text-muted-foreground">No training history yet.</p>
        {/if}
      </Card.Content>
      {#if statusData.length > 0}
        <Card.Footer>
          <Button variant="outline" size="sm" href={resolve("/dashboard/training-history")}>
            See status details
          </Button>
        </Card.Footer>
      {/if}
    </Card.Root>
  </div>
  <div class="min-h-screen flex-1 overflow-hidden rounded-xl bg-muted/50 md:min-h-min">
    <DashboardMap points={data.mapPoints} />
  </div>
</div>

{#if renewPayload}
  <TrainingRecordDrawer
    bind:open={renewOpen}
    record={renewPayload.record}
    employees={renewPayload.employees}
    trainings={renewPayload.trainings}
    locations={renewPayload.locations}
    role={renewPayload.role}
    currentEmployeeId={renewPayload.currentEmployeeId}
    renewedFromId={renewPayload.renewedFromId}
  />
{/if}
