<script lang="ts" module>
  import type { ColumnDef } from "@tanstack/table-core";
  import type { Schema } from "$lib/components/training-history/schemas";
  import { renderComponent, renderSnippet } from "$lib/components/ui/data-table";
  import DataTableCheckbox from "$lib/components/training-history/data-table-checkbox.svelte";
  import DataTableCellViewer from "$lib/components/training-history/data-table-cell-viewer.svelte";
  import DataTableReviewer from "$lib/components/training-history/data-table-reviewer.svelte";
  import DataTableActions from "$lib/components/training-history/data-table-actions.svelte";

  export const columns: ColumnDef<Schema>[] = [
    {
      id: "select",
      header: ({ table }) =>
        renderComponent(DataTableCheckbox, {
          checked: table.getIsAllPageRowsSelected(),
          indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
          onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
          "aria-label": "Select all",
        }),
      cell: ({ row }) =>
        renderComponent(DataTableCheckbox, {
          checked: row.getIsSelected(),
          disabled: !row.getCanSelect(),
          onCheckedChange: (value) => row.toggleSelected(!!value),
          "aria-label": "Select row",
        }),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: "ID",
      enableHiding: false,
    },
    {
      accessorKey: "traineeName",
      header: "Trainee",
      cell: ({ row }) => renderComponent(DataTableCellViewer, { item: row.original }),
      enableHiding: false,
    },
    {
      accessorKey: "trainingName",
      header: "Training",
      cell: ({ row }) => renderSnippet(DataTableTraining, { row }),
    },
    {
      accessorKey: "location",
      header: "Location",
    },
    {
      accessorKey: "trainingDate",
      header: "Training Date",
      cell: ({ row }) => renderSnippet(DataTableDate, { row }),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => renderSnippet(DataTableStatus, { row }),
    },
    {
      accessorKey: "reviewer",
      header: "Reviewer",
      cell: ({ row }) => renderComponent(DataTableReviewer, { row }),
    },
    {
      accessorKey: "certificateId",
      header: "Cert ID",
      cell: ({ row }) => renderSnippet(DataTableCertId, { row }),
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
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type ColumnFiltersState,
    type PaginationState,
    type Row,
    type RowSelectionState,
    type SortingState,
    type VisibilityState,
  } from "@tanstack/table-core";
  import { untrack, setContext } from "svelte";
  import { createSvelteTable } from "$lib/components/ui/data-table/data-table.svelte";
  import * as Tabs from "$lib/components/ui/tabs";
  import * as Table from "$lib/components/ui/table";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { Button } from "$lib/components/ui/button";
  import * as Select from "$lib/components/ui/select";
  import { Label } from "$lib/components/ui/label";
  import { Badge } from "$lib/components/ui/badge";
  import { FlexRender } from "$lib/components/ui/data-table";
  import { resolve } from "$app/paths";
  import { toast } from "svelte-sonner";
  import TrainingRecordDrawer from "$lib/components/training-history/training-record-drawer.svelte";
  import LayoutColumnsIcon from "@tabler/icons-svelte/icons/layout-columns";
  import ChevronDownIcon from "@tabler/icons-svelte/icons/chevron-down";
  import PlusIcon from "@tabler/icons-svelte/icons/plus";
  import ChevronsLeftIcon from "@tabler/icons-svelte/icons/chevrons-left";
  import ChevronLeftIcon from "@tabler/icons-svelte/icons/chevron-left";
  import ChevronRightIcon from "@tabler/icons-svelte/icons/chevron-right";
  import ChevronsRightIcon from "@tabler/icons-svelte/icons/chevrons-right";
  import CircleCheckFilledIcon from "@tabler/icons-svelte/icons/circle-check-filled";
  import CircleXIcon from "@tabler/icons-svelte/icons/circle-x";
  import LoaderIcon from "@tabler/icons-svelte/icons/loader";
  import TrashIcon from "@tabler/icons-svelte/icons/trash";

  let {
    data,
    reviewers = [],
    currentUserRole = "USER",
    currentEmployeeId = 0,
    simplified = false,
  }: {
    data: Schema[];
    reviewers?: { id: number; name: string }[];
    currentUserRole?: "USER" | "REVIEWER" | "ADMINISTRATOR";
    currentEmployeeId?: number;
    simplified?: boolean;
  } = $props();

  setContext("tableCtx", {
    get reviewers() {
      return reviewers;
    },
    get currentUserRole() {
      return currentUserRole;
    },
    get drawerLoading() {
      return drawerLoading || createLoading;
    },
    viewDetails,
  });

  let view = $state("all");

  const tableData = $derived(view === "all" ? data : data.filter((r) => r.status === view));
  const pendingCount = $derived(data.filter((r) => r.status === "PENDING").length);

  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
  let sorting = $state<SortingState>([]);
  let columnFilters = $state<ColumnFiltersState>([]);
  let rowSelection = $state<RowSelectionState>({});
  // User-controlled column visibility; select column is always hidden in simplified mode.
  let userColumnVisibility = $state<VisibilityState>({});

  const hasSelection = $derived(Object.keys(rowSelection).length > 0);

  // Reset page and selection when tab changes.
  // untrack prevents reading pagination/rowSelection from becoming dependencies,
  // which would cause this effect to re-run on every page turn.
  $effect(() => {
    void view;
    untrack(() => {
      pagination = { pageIndex: 0, pageSize: pagination.pageSize };
      rowSelection = {};
    });
  });

  const table = createSvelteTable({
    get data() {
      return tableData;
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
        return simplified ? { select: false, ...userColumnVisibility } : userColumnVisibility;
      },
      get rowSelection() {
        return rowSelection;
      },
      get columnFilters() {
        return columnFilters;
      },
    },
    getRowId: (row) => row.id.toString(),
    get enableRowSelection() {
      return (row: Row<Schema>) => {
        if (currentUserRole === "ADMINISTRATOR") return true;
        if (currentUserRole === "REVIEWER") {
          return (
            row.original.traineeId === currentEmployeeId ||
            row.original.reviewerId === currentEmployeeId ||
            (row.original.status === "PENDING" && row.original.reviewerId === null)
          );
        }
        // USER: only own rows
        return row.original.traineeId === currentEmployeeId;
      };
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        pagination = updater(pagination);
      } else {
        pagination = updater;
      }
    },
    onSortingChange: (updater) => {
      if (typeof updater === "function") {
        sorting = updater(sorting);
      } else {
        sorting = updater;
      }
    },
    onColumnFiltersChange: (updater) => {
      if (typeof updater === "function") {
        columnFilters = updater(columnFilters);
      } else {
        columnFilters = updater;
      }
    },
    onColumnVisibilityChange: (updater) => {
      if (typeof updater === "function") {
        userColumnVisibility = updater(userColumnVisibility);
      } else {
        userColumnVisibility = updater;
      }
    },
    onRowSelectionChange: (updater) => {
      if (typeof updater === "function") {
        rowSelection = updater(rowSelection);
      } else {
        rowSelection = updater;
      }
    },
  });

  const views = [
    { id: "all", label: "All" },
    { id: "PENDING", label: "Pending" },
    { id: "APPROVED", label: "Approved" },
    { id: "REJECTED", label: "Rejected" },
  ];

  let viewLabel = $derived(views.find((v) => view === v.id)?.label ?? "Select a view");

  // ── Drawer state ──────────────────────────────────────────────────────────
  type DrawerPayload = {
    record: {
      id: number;
      traineeId: number;
      reviewerId: number | null;
      trainingCode: string;
      locationCode: string;
      trainingDate: string;
      status: "PENDING" | "APPROVED" | "REJECTED";
      remarks: string | null;
      certificateId: string | null;
    } | null;
    employees: { id: number; name: string }[];
    trainings: { code: string; name: string }[];
    locations: { code: string; name: string }[];
    role: "USER" | "REVIEWER" | "ADMINISTRATOR";
    currentEmployeeId?: number;
  };

  let drawerOpen = $state(false);
  let drawerLoading = $state(false);
  let createLoading = $state(false);
  let drawerPayload = $state<DrawerPayload | null>(null);

  async function viewDetails(id: number) {
    drawerLoading = true;
    try {
      const res = await fetch(resolve(`/dashboard/training-history/${id}`), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      drawerPayload = await res.json();
      drawerOpen = true;
    } catch (err) {
      console.error(err);
      toast.error("Failed to load record details");
    } finally {
      drawerLoading = false;
    }
  }

  async function openCreate() {
    createLoading = true;
    try {
      const res = await fetch(resolve("/dashboard/training-history"), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      drawerPayload = { ...json, record: null, currentEmployeeId };
      drawerOpen = true;
    } catch (err) {
      console.error(err);
      toast.error("Failed to load form");
    } finally {
      createLoading = false;
    }
  }
</script>

{#if simplified}
  <div class="relative flex flex-col gap-4 overflow-auto">
    {@render TableContent()}
  </div>
{:else}
  <Tabs.Root bind:value={view} class="w-full flex-col justify-start gap-6">
    <div class="flex items-center justify-between">
      <Label for="view-selector" class="sr-only">View</Label>
      <Select.Root type="single" bind:value={view}>
        <Select.Trigger class="flex w-fit @4xl/main:hidden" size="sm" id="view-selector">
          {viewLabel}
        </Select.Trigger>
        <Select.Content>
          {#each views as v (v.id)}
            <Select.Item value={v.id}>{v.label}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      <Tabs.List
        class="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex"
      >
        {#each views as v (v.id)}
          <Tabs.Trigger value={v.id}>
            {v.label}
            {#if v.id === "PENDING" && pendingCount > 0}
              <Badge variant="secondary">{pendingCount}</Badge>
            {/if}
          </Tabs.Trigger>
        {/each}
      </Tabs.List>
      <div class="flex items-center gap-2">
        {#if hasSelection}
          <Button variant="destructive" size="sm" onclick={() => (rowSelection = {})}>
            <TrashIcon />
            <span class="hidden lg:inline"
              >Delete Selected ({Object.keys(rowSelection).length})</span
            >
            <span class="lg:hidden">Delete ({Object.keys(rowSelection).length})</span>
          </Button>
        {:else}
          {@render ColumnsDropdown()}
        {/if}
        <Button variant="outline" size="sm" onclick={openCreate} disabled={createLoading}>
          <PlusIcon />
          <span class="hidden lg:inline">Add Training Record</span>
          <span class="lg:hidden">Add</span>
        </Button>
      </div>
    </div>

    {#each views as v (v.id)}
      <Tabs.Content value={v.id} class="relative flex flex-col gap-4 overflow-auto">
        {@render TableContent()}
      </Tabs.Content>
    {/each}
  </Tabs.Root>
{/if}

{#snippet ColumnsDropdown()}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button variant="outline" size="sm" {...props}>
          <LayoutColumnsIcon />
          <span class="hidden lg:inline">Customize Columns</span>
          <span class="lg:hidden">Columns</span>
          <ChevronDownIcon />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" class="w-56">
      {#each table
        .getAllColumns()
        .filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide()) as column (column.id)}
        <DropdownMenu.CheckboxItem
          class="capitalize"
          checked={column.getIsVisible()}
          onCheckedChange={(value) => column.toggleVisibility(!!value)}
        >
          {column.id}
        </DropdownMenu.CheckboxItem>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/snippet}

{#snippet TableContent()}
  <div class="overflow-hidden rounded-lg border">
    <Table.Root>
      <Table.Header class="sticky top-0 z-10 bg-muted">
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row>
            {#each headerGroup.headers as header (header.id)}
              <Table.Head colspan={header.colSpan}>
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
        {#if table.getRowModel().rows?.length}
          {#each table.getRowModel().rows as row (row.id)}
            <Table.Row data-state={row.getIsSelected() && "selected"}>
              {#each row.getVisibleCells() as cell (cell.id)}
                <Table.Cell>
                  <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
                </Table.Cell>
              {/each}
            </Table.Row>
          {/each}
        {:else}
          <Table.Row>
            <Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
          </Table.Row>
        {/if}
      </Table.Body>
    </Table.Root>
  </div>
  {#if !simplified}
    <div class="flex items-center justify-between">
      <div class="hidden flex-1 text-sm text-muted-foreground lg:flex">
        {table.getFilteredSelectedRowModel().rows.length} of
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div class="flex w-full items-center gap-8 lg:w-fit">
        {#if !simplified}
          <div class="hidden items-center gap-2 lg:flex">
            <Label for="rows-per-page" class="text-sm font-medium">Rows per page</Label>
            <Select.Root
              type="single"
              bind:value={
                () => `${pagination.pageSize}`,
                (v) => {
                  pagination = { pageIndex: 0, pageSize: Number(v) };
                }
              }
            >
              <Select.Trigger size="sm" class="w-20" id="rows-per-page">
                {pagination.pageSize}
              </Select.Trigger>
              <Select.Content side="top">
                {#each [10, 20, 30, 40, 50] as pageSize (pageSize)}
                  <Select.Item value={pageSize.toString()}>
                    {pageSize}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        {/if}
        <div class="flex w-fit items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of
          {table.getPageCount()}
        </div>
        <div class="ms-auto flex items-center gap-2 lg:ms-0">
          <Button
            variant="outline"
            class="hidden h-8 w-8 p-0 lg:flex"
            onclick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span class="sr-only">Go to first page</span>
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            class="size-8"
            size="icon"
            onclick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span class="sr-only">Go to previous page</span>
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            class="size-8"
            size="icon"
            onclick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span class="sr-only">Go to next page</span>
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            class="hidden size-8 lg:flex"
            size="icon"
            onclick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span class="sr-only">Go to last page</span>
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  {/if}
{/snippet}

{#snippet DataTableCertId({ row }: { row: Row<Schema> })}
  {#if row.original.certificateId}
    <span class="font-mono text-xs">{row.original.certificateId}</span>
  {:else}
    <span class="text-muted-foreground">—</span>
  {/if}
{/snippet}

{#snippet DataTableTraining({ row }: { row: Row<Schema> })}
  <div class="flex items-center gap-2">
    <Badge variant="outline" class="px-1.5 font-mono text-xs text-muted-foreground">
      {row.original.trainingCode}
    </Badge>
    <span class="max-w-48 truncate">{row.original.trainingName}</span>
  </div>
{/snippet}

{#snippet DataTableDate({ row }: { row: Row<Schema> })}
  <div class="text-sm tabular-nums">
    {new Date(row.original.trainingDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}
  </div>
{/snippet}

{#snippet DataTableStatus({ row }: { row: Row<Schema> })}
  {#if row.original.status === "APPROVED"}
    <Badge
      variant="outline"
      class="border-green-200 px-1.5 text-green-700 dark:border-green-800 dark:text-green-400"
    >
      <CircleCheckFilledIcon class="fill-green-500 dark:fill-green-400" />
      APPROVED
    </Badge>
  {:else if row.original.status === "REJECTED"}
    <Badge
      variant="outline"
      class="border-red-200 px-1.5 text-red-700 dark:border-red-800 dark:text-red-400"
    >
      <CircleXIcon class="text-red-500 dark:text-red-400" />
      REJECTED
    </Badge>
  {:else}
    <Badge
      variant="outline"
      class="border-yellow-200 px-1.5 text-yellow-700 dark:border-yellow-800 dark:text-yellow-400"
    >
      <LoaderIcon />
      PENDING
    </Badge>
  {/if}
{/snippet}

{#if drawerPayload}
  {#key drawerPayload.record?.id ?? "create"}
    <TrainingRecordDrawer
      bind:open={drawerOpen}
      record={drawerPayload.record}
      employees={drawerPayload.employees}
      trainings={drawerPayload.trainings}
      locations={drawerPayload.locations}
      role={drawerPayload.role}
      currentEmployeeId={drawerPayload.currentEmployeeId ?? currentEmployeeId}
    />
  {/key}
{/if}
