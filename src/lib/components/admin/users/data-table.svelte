<script lang="ts" module>
  import type { ColumnDef } from "@tanstack/table-core";
  import type { Schema } from "$lib/components/admin/users/schemas";
  import { renderComponent } from "$lib/components/ui/data-table";
  import DataTableActions from "$lib/components/admin/users/data-table-actions.svelte";

  export const columns: ColumnDef<Schema>[] = [
    {
      accessorKey: "id",
      header: "ID",
      enableHiding: false,
    },
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => `${row.original.givenName} ${row.original.surname}`,
      enableHiding: false,
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "position",
      header: "Position",
    },
    {
      accessorKey: "role",
      header: "Role",
    },
    {
      id: "actions",
      cell: ({ row }) => renderComponent(DataTableActions, { row }),
    },
  ];
</script>

<script lang="ts">
  import {
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type PaginationState,
    type SortingState,
    type VisibilityState,
  } from "@tanstack/table-core";
  import { setContext } from "svelte";
  import { createSvelteTable } from "$lib/components/ui/data-table/data-table.svelte";
  import { FlexRender } from "$lib/components/ui/data-table";
  import * as Table from "$lib/components/ui/table";
  import { Button } from "$lib/components/ui/button";
  import UserDrawer from "$lib/components/admin/users/user-drawer.svelte";
  import ChevronLeftIcon from "@tabler/icons-svelte/icons/chevron-left";
  import ChevronRightIcon from "@tabler/icons-svelte/icons/chevron-right";
  import PlusIcon from "@tabler/icons-svelte/icons/plus";
  import type { Schema } from "$lib/components/admin/users/schemas";

  let { data }: { data: Schema[] } = $props();

  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 15 });
  let sorting = $state<SortingState>([]);
  let columnVisibility = $state<VisibilityState>({});

  const table = createSvelteTable({
    get data() {
      return data;
    },
    columns,
    state: {
      get pagination() {
        return pagination;
      },
      get sorting() {
        return sorting;
      },
      get columnVisibility() {
        return columnVisibility;
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: (updater) => {
      if (typeof updater === "function") pagination = updater(pagination);
      else pagination = updater;
    },
    onSortingChange: (updater) => {
      if (typeof updater === "function") sorting = updater(sorting);
      else sorting = updater;
    },
  });

  let drawerOpen = $state(false);
  let drawerRecord = $state<Schema | null>(null);

  function openCreate() {
    drawerRecord = null;
    drawerOpen = false;
    setTimeout(() => {
      drawerOpen = true;
    }, 0);
  }

  function openEdit(record: Schema) {
    drawerRecord = record;
    drawerOpen = false;
    setTimeout(() => {
      drawerOpen = true;
    }, 0);
  }

  setContext("usersTableCtx", { openEdit });
</script>

<div class="flex items-center justify-between px-4 lg:px-6">
  <div class="flex items-center gap-2">
    <Button variant="outline" size="sm" onclick={openCreate}>
      <PlusIcon />
      <span class="hidden md:ml-1 md:inline">Add User</span>
    </Button>
  </div>
</div>

<div class="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
  <div class="overflow-hidden rounded-lg border">
    <Table.Root>
      <Table.Header class="sticky top-0 z-10 bg-muted">
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row class="hover:bg-muted">
            {#each headerGroup.headers as header (header.id)}
              <Table.Head
                class={`h-10 text-xs ${
                  header.column.id === "name"
                    ? "lg:w-[40%]"
                    : header.column.id === "email"
                      ? "lg:w-[30%]"
                      : header.column.id === "position"
                        ? "lg:w-[20%]"
                        : header.column.id === "actions"
                          ? "w-10"
                          : ""
                } ${header.column.id === "actions" ? "text-right whitespace-nowrap" : ""}`}
              >
                {#if !header.isPlaceholder}
                  <FlexRender
                    content={header.column.columnDef.header}
                    context={header.getContext()}
                  />
                {/if}
              </Table.Head>
            {/each}
          </Table.Row>
        {/each}
      </Table.Header>
      <Table.Body>
        {#each table.getRowModel().rows as row (row.id)}
          <Table.Row
            class="h-12 cursor-pointer border-b transition-colors hover:bg-muted/50"
            onclick={() => openEdit(row.original)}
          >
            {#each row.getVisibleCells() as cell (cell.id)}
              <Table.Cell
                class={`py-2 text-sm first:pl-4 last:pr-4 ${
                  cell.column.id === "name"
                    ? "lg:w-[40%]"
                    : cell.column.id === "email"
                      ? "lg:w-[30%]"
                      : cell.column.id === "position"
                        ? "lg:w-[20%]"
                        : cell.column.id === "actions"
                          ? "w-10"
                          : ""
                } ${cell.column.id === "actions" ? "text-right whitespace-nowrap" : ""}`}
                onclick={(e) => {
                  if (cell.column.id === "actions") e.stopPropagation();
                }}
              >
                <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
              </Table.Cell>
            {/each}
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>

  <div class="flex items-center justify-between">
    <div class="text-sm text-muted-foreground">
      Showing {table.getRowModel().rows.length} of {data.length}
    </div>
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onclick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronLeftIcon />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onclick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  </div>
</div>

<UserDrawer bind:open={drawerOpen} record={drawerRecord} />
