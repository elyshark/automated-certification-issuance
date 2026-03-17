<script lang="ts">
  import DataTable from "$lib/components/admin/locations/data-table.svelte";

  let { data } = $props();
</script>

<div class="@container/main flex flex-1 flex-col gap-2">
  <div class="p-4 pb-0 lg:p-6 lg:pb-0">
    <h1 class="text-3xl font-bold tracking-tight">Locations</h1>
    <p class="mt-2 text-muted-foreground">Manage airport locations used for trainings.</p>
  </div>
  <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
    <DataTable data={data.locations} />
  </div>
</div>
