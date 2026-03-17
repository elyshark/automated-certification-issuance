<script lang="ts">
  import { getContext } from "svelte";
  import type { Row } from "@tanstack/table-core";
  import type { Schema } from "$lib/components/training-history/schemas";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import { invalidateAll } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { toast } from "svelte-sonner";

  let { row }: { row: Row<Schema> } = $props();

  const ctx = getContext<{
    reviewers: { id: number; name: string }[];
    currentUserRole: "USER" | "REVIEWER" | "ADMINISTRATOR";
  }>("tableCtx");

  const canAssignReviewer = $derived(
    ctx.currentUserRole === "ADMINISTRATOR" ||
      (ctx.currentUserRole === "REVIEWER" && row.original.reviewerId === null),
  );

  const isAssigned = $derived(row.original.reviewer !== null);
  let reviewer = $state("");
  let assigning = $state(false);

  async function handleAssign(reviewerName: string) {
    const selected = ctx.reviewers.find((r) => r.name === reviewerName);
    if (!selected) return;

    assigning = true;
    try {
      const formData = new FormData();
      formData.set("trainingHistoryId", String(row.original.id));
      formData.set("reviewerId", String(selected.id));

      const res = await fetch(`${resolve("/dashboard/training-history")}?/assignReviewer`, {
        method: "POST",
        body: formData,
        headers: {
          "x-sveltekit-action": "true",
        },
      });

      const result = await res.json();

      if (result.type === "failure") {
        throw new Error(result.data?.error ?? "Action failed");
      }

      toast.success(`Assigned ${reviewerName} as reviewer`);
      await invalidateAll();
    } catch {
      toast.error("Failed to assign reviewer");
      reviewer = "";
    } finally {
      assigning = false;
    }
  }
</script>

{#if isAssigned}
  {row.original.reviewer}
{:else if row.original.status === "PENDING" && canAssignReviewer}
  <Label for="{row.original.id}-reviewer" class="sr-only">Reviewer</Label>
  <Select.Root
    type="single"
    bind:value={reviewer}
    onValueChange={handleAssign}
    disabled={assigning}
  >
    <Select.Trigger
      class="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
      size="sm"
      id="{row.original.id}-reviewer"
    >
      <span data-slot="select-value">
        {#if assigning}
          Assigning…
        {:else}
          {reviewer || "Assign reviewer"}
        {/if}
      </span>
    </Select.Trigger>
    <Select.Content align="end">
      {#each ctx.reviewers as r (r.id)}
        <Select.Item value={r.name}>{r.name}</Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
{:else if row.original.status === "PENDING"}
  <span class="text-muted-foreground">Unassigned</span>
{:else}
  <span class="text-muted-foreground">—</span>
{/if}
