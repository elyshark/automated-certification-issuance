<script lang="ts">
  import DataTable from "$lib/components/training-history/data-table.svelte";

  let { data } = $props();
</script>

<div class="@container/main flex flex-col space-y-6 p-4 md:p-6">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Training History</h1>
    <p class="mt-2 text-muted-foreground">
      View {data.role === "USER" ? "your" : "all"} training histories and details.
    </p>
  </div>
  <div class="flex flex-col gap-4 md:gap-6">
    <DataTable
      data={data.trainingHistory}
      reviewers={data.reviewers}
      currentUserRole={data.employee?.role ?? "USER"}
      currentEmployeeId={data.employee?.id ?? 0}
    />
  </div>
</div>
