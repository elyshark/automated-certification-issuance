<script lang="ts">
  import type { PageData } from "./$types";
  import * as Card from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import AreaChart from "$lib/components/admin/area-chart.svelte";
  import DonutChart from "$lib/components/admin/donut-chart.svelte";
  import DataTable from "$lib/components/training-history/data-table.svelte";

  let { data }: { data: PageData } = $props();

  const totalPersonnel = $derived(data.allEmployees.length);
  const totalTerminals = $derived(data.allLocations.length);
  const pendingActions = $derived(
    data.allTrainingHistory.filter((th) => th.status === "PENDING").length,
  );

  const overallCompliance = $derived.by(() => {
    const now = new Date();
    const employeesWithValidCerts: Record<number, boolean> = {};

    for (const cert of data.allCertificates) {
      if (cert.expiryDate) {
        const expiryDate = new Date(cert.expiryDate);
        if (!isNaN(expiryDate.getTime()) && expiryDate >= now) {
          employeesWithValidCerts[cert.employeeId] = true;
        }
      }
    }

    if (totalPersonnel === 0) return 0;

    const validCount = Object.keys(employeesWithValidCerts).length;
    const compliancePercentage = Math.round((validCount / totalPersonnel) * 100);
    return compliancePercentage;
  });

  const locationStats = $derived.by(() => {
    const stats: Record<string, { locationCode: string; locationName: string; approved: number }> =
      {};
    for (const loc of data.allLocations) {
      stats[loc.code] = { locationCode: loc.code, locationName: loc.name, approved: 0 };
    }
    for (const th of data.allTrainingHistory) {
      if (th.status === "APPROVED" && stats[th.locationCode]) {
        stats[th.locationCode].approved += 1;
      }
    }
    return Object.values(stats);
  });

  const validityStats = $derived.by(() => {
    let valid = 0;
    let expiringSoon = 0;
    let expired = 0;

    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Group training history by trainee and trainingCode to find renewed statuses
    // eslint-disable-next-line
    const renewedTrainingIds = new Set<number>();
    for (const th of data.allTrainingHistory) {
      if (th.renewedFromId) {
        renewedTrainingIds.add(th.renewedFromId);
      }
    }

    for (const th of data.allTrainingHistory) {
      if (th.status !== "APPROVED" || !th.certificate) continue;

      const expiry = new Date(th.certificate.expiryDate!);
      const isRenewed = renewedTrainingIds.has(th.id);

      if (expiry < now) {
        // Expired certs should only be counted if there is no training history renewed.
        if (!isRenewed) {
          expired++;
        }
      } else if (expiry <= ninetyDaysFromNow) {
        expiringSoon++;
      } else {
        valid++;
      }
    }

    return { valid, expiringSoon, expired };
  });
</script>

<div class="@container/main flex flex-1 flex-col gap-6">
  <div class="flex flex-col gap-6 py-4 md:py-6">
    <!-- SECTION 1: KPI CARDS -->
    <div class="px-4 lg:px-6">
      <div class="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <!-- Card 1: Total Personnel -->
        <Card.Root>
          <Card.Header class="pb-3">
            <Card.Title class="text-sm font-medium text-muted-foreground">
              Total Personnel
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold">{totalPersonnel}</div>
          </Card.Content>
        </Card.Root>

        <!-- Card 2: Total Terminals -->
        <Card.Root>
          <Card.Header class="pb-3">
            <Card.Title class="text-sm font-medium text-muted-foreground">
              Total Terminals
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold">{totalTerminals}</div>
          </Card.Content>
        </Card.Root>

        <!-- Card 3: Overall Compliance % -->
        <Card.Root>
          <Card.Header class="pb-3">
            <Card.Title class="text-sm font-medium text-muted-foreground">
              Overall Compliance %
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold">{overallCompliance}%</div>
            <p class="pt-2 text-xs text-muted-foreground">% of valid trainings</p>
          </Card.Content>
        </Card.Root>

        <!-- Card 4: Pending Actions -->
        <Card.Root>
          <Card.Header class="pb-3">
            <Card.Title class="text-sm font-medium text-muted-foreground">
              Pending Actions
            </Card.Title>
          </Card.Header>
          <Card.Content class="flex flex-col gap-3">
            <div class="text-3xl font-bold">{pendingActions}</div>
            <div class="flex items-center justify-between">
              <p class="text-xs text-muted-foreground">Certs waiting for approval</p>
              {#if pendingActions > 5}
                <Badge variant="destructive" class="text-xs">Critical</Badge>
              {/if}
            </div>
          </Card.Content>
        </Card.Root>
      </div>
    </div>

    <!-- SECTION 2: CHARTS -->
    <div class="px-4 lg:px-6">
      <div class="grid grid-cols-1 gap-4 @5xl/main:grid-cols-3">
        <!-- Left Column: Training Validity Chart -->
        <DonutChart
          valid={validityStats.valid}
          expiringSoon={validityStats.expiringSoon}
          expired={validityStats.expired}
        />

        <!-- Right Column: Approved Trainings by Location -->
        <AreaChart chartData={locationStats} />
      </div>
    </div>

    <!-- SECTION 3: RECENT TRAININGS TABLE -->
    <div class="px-4 lg:px-6">
      <DataTable
        data={data.trainingHistory}
        reviewers={data.reviewers}
        currentUserRole={data.employee?.role ?? "USER"}
        currentEmployeeId={data.employee?.id ?? 0}
        simplified
      />
    </div>
  </div>
</div>
