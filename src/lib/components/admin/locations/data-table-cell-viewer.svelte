<script lang="ts">
  import * as Drawer from "$lib/components/ui/drawer";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { IsMobile } from "$lib/hooks/is-mobile.svelte";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import { Separator } from "$lib/components/ui/separator";
  import { Textarea } from "$lib/components/ui/textarea";
  import type { Schema } from "$lib/components/training-history/schemas";
  import CircleCheckFilledIcon from "@tabler/icons-svelte/icons/circle-check-filled";
  import CircleXIcon from "@tabler/icons-svelte/icons/circle-x";
  import LoaderIcon from "@tabler/icons-svelte/icons/loader";
  import { untrack } from "svelte";

  const isMobile = new IsMobile();

  let { item }: { item: Schema } = $props();

  // untrack prevents the "state_referenced_locally" warning — we intentionally
  // want local editable copies initialized once from the prop.
  let status = $state(untrack(() => item.status));
  let remarks = $state(untrack(() => item.remarks ?? ""));

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
</script>

<Drawer.Root direction={isMobile.current ? "bottom" : "right"}>
  <Drawer.Trigger>
    {#snippet child({ props })}
      <Button variant="link" class="w-fit px-0 text-start text-foreground" {...props}>
        {item.traineeName}
      </Button>
    {/snippet}
  </Drawer.Trigger>
  <Drawer.Content>
    <Drawer.Header class="gap-1">
      <Drawer.Title>{item.traineeName}</Drawer.Title>
      <Drawer.Description class="flex items-center gap-2">
        <Badge variant="outline" class="font-mono text-xs">
          {item.trainingCode}
        </Badge>
        {item.trainingName}
      </Drawer.Description>
    </Drawer.Header>

    <div class="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
      <div class="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border p-4">
        <div class="flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">Location</span>
          <span class="font-medium">{item.location}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">Training Date</span>
          <span class="font-medium">{formatDate(item.trainingDate)}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">Status</span>
          <div>
            {#if item.status === "APPROVED"}
              <Badge
                variant="outline"
                class="border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
              >
                <CircleCheckFilledIcon class="fill-green-500 dark:fill-green-400" />
                APPROVED
              </Badge>
            {:else if item.status === "REJECTED"}
              <Badge
                variant="outline"
                class="border-red-200 text-red-700 dark:border-red-800 dark:text-red-400"
              >
                <CircleXIcon class="text-red-500 dark:text-red-400" />
                REJECTED
              </Badge>
            {:else}
              <Badge
                variant="outline"
                class="border-yellow-200 text-yellow-700 dark:border-yellow-800 dark:text-yellow-400"
              >
                <LoaderIcon />
                PENDING
              </Badge>
            {/if}
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">Reviewer</span>
          <span class="font-medium">{item.reviewer ?? "—"}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">Reviewed Date</span>
          <span class="font-medium">{formatDate(item.reviewedDate) ?? "—"}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">Certificate ID</span>
          <span class="font-mono font-medium">{item.certificateId ?? "—"}</span>
        </div>
      </div>

      {#if item.remarks}
        <div class="flex flex-col gap-1 rounded-lg border border-dashed p-4">
          <span class="text-xs text-muted-foreground">Remarks</span>
          <p class="text-sm">{item.remarks}</p>
        </div>
      {/if}

      <Separator />

      <form class="flex flex-col gap-4">
        <div class="flex flex-col gap-3">
          <Label for="status-{item.id}">Update Status</Label>
          <Select.Root type="single" bind:value={status}>
            <Select.Trigger id="status-{item.id}" class="w-full">
              {status}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="PENDING">PENDING</Select.Item>
              <Select.Item value="APPROVED">APPROVED</Select.Item>
              <Select.Item value="REJECTED">REJECTED</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>
        <div class="flex flex-col gap-3">
          <Label for="remarks-{item.id}">Remarks</Label>
          <Textarea
            id="remarks-{item.id}"
            bind:value={remarks}
            placeholder="Add reviewer remarks..."
            class="resize-none"
            rows={3}
          />
        </div>
      </form>
    </div>

    <Drawer.Footer>
      <Button>Save Changes</Button>
      <Drawer.Close>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>Close</Button>
        {/snippet}
      </Drawer.Close>
    </Drawer.Footer>
  </Drawer.Content>
</Drawer.Root>
