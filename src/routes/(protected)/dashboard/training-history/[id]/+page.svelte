<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import TrainingRecordDrawer from "$lib/components/training-history/training-record-drawer.svelte";

  let { data } = $props();

  let open = $state(true);

  $effect(() => {
    if (!open) goto(resolve("/dashboard/training-history"));
  });
</script>

<TrainingRecordDrawer
  bind:open
  record={data.record}
  employees={data.employees}
  trainings={data.trainings}
  locations={data.locations}
  role={(data.role ?? "USER") as "USER" | "REVIEWER" | "ADMINISTRATOR"}
/>
