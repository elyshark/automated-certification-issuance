<script lang="ts">
  import { getContext } from "svelte";
  import type { Row } from "@tanstack/table-core";
  import type { Schema } from "$lib/components/admin/users/schemas";
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import { resolve } from "$app/paths";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { Button } from "$lib/components/ui/button";
  import { toast } from "svelte-sonner";
  import DotsVerticalIcon from "@tabler/icons-svelte/icons/dots-vertical";

  let { row }: { row: Row<Schema> } = $props();

  const ctx = getContext<{ openEdit: (record: Schema) => void }>("usersTableCtx");

  let deleteOpen = $state(false);
  let deleting = $state(false);

  const deleteAction = resolve("/admin/users") + "?/delete";

  const fullName = () => `${row.original.givenName} ${row.original.surname}`.trim();

  const handleDelete = () => {
    deleting = true;
    return async ({ result }) => {
      deleting = false;
      if (result.type === "success") {
        toast.success(`Deleted ${fullName()}`);
        deleteOpen = false;
        await invalidateAll();
      } else if (result.type === "failure") {
        toast.error("Failed to delete user");
      } else {
        toast.error("An unexpected error occurred");
      }
    };
  };
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class="flex size-8 text-muted-foreground data-[state=open]:bg-muted">
    {#snippet child({ props })}
      <Button variant="ghost" size="icon" {...props}>
        <DotsVerticalIcon />
        <span class="sr-only">Open menu</span>
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="w-40">
    <DropdownMenu.Item onclick={() => ctx.openEdit(row.original)}>View Details</DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item variant="destructive" onclick={() => (deleteOpen = true)}>
      Delete
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<Dialog.Root bind:open={deleteOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Delete User</Dialog.Title>
      <Dialog.Description>This will permanently delete {fullName()}.</Dialog.Description>
    </Dialog.Header>
    <form method="post" action={deleteAction} use:enhance={handleDelete}>
      <input type="hidden" name="id" value={row.original.id} />
      <Dialog.Footer class="gap-2 sm:gap-3">
        <Dialog.Close>
          {#snippet child({ props })}
            <Button variant="outline" {...props} disabled={deleting}>Cancel</Button>
          {/snippet}
        </Dialog.Close>
        <Button type="submit" variant="destructive" disabled={deleting}>
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
