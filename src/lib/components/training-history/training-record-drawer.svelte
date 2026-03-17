<script lang="ts">
  import { resolve } from "$app/paths";
  import { invalidateAll } from "$app/navigation";
  import { enhance } from "$app/forms";
  import type { SubmitFunction } from "@sveltejs/kit";
  import { untrack } from "svelte";
  import * as v from "valibot";
  import { CalendarDate, getLocalTimeZone } from "@internationalized/date";
  import type { DateValue } from "@internationalized/date";

  import * as Drawer from "$lib/components/ui/drawer";
  import * as Popover from "$lib/components/ui/popover";
  import * as Command from "$lib/components/ui/command";
  import { Calendar } from "$lib/components/ui/calendar";
  import * as Select from "$lib/components/ui/select";
  import { Field, FieldGroup, FieldLabel, FieldError } from "$lib/components/ui/field";
  import { Button } from "$lib/components/ui/button";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Input } from "$lib/components/ui/input";
  import { Spinner } from "$lib/components/ui/spinner";
  import { IsMobile } from "$lib/hooks/is-mobile.svelte";
  import { toast } from "svelte-sonner";

  import CheckIcon from "@tabler/icons-svelte/icons/check";
  import CalendarIcon from "@tabler/icons-svelte/icons/calendar";
  import SelectorIcon from "@tabler/icons-svelte/icons/selector";

  type RecordData = {
    id: number;
    traineeId: number;
    reviewerId: number | null;
    trainingCode: string;
    locationCode: string;
    trainingDate: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    remarks: string | null;
    certificateId: string | null;
  };

  let {
    open = $bindable(false),
    record = null,
    renewedFromId = null,
    employees,
    trainings,
    locations,
    role,
    currentEmployeeId = 0,
  }: {
    open: boolean;
    record?: RecordData | null;
    renewedFromId?: number | null;
    employees: { id: number; name: string }[];
    trainings: { code: string; name: string }[];
    locations: { code: string; name: string }[];
    role: "USER" | "REVIEWER" | "ADMINISTRATOR";
    currentEmployeeId?: number;
  } = $props();

  const isMobile = new IsMobile();
  const isCreate = $derived(record == null);
  /** USER or REVIEWER creating a new record for themselves — simplified form */
  const selfCreateMode = $derived(isCreate && (role === "USER" || role === "REVIEWER"));
  /** In edit mode, REVIEWER can edit if reviewer is unassigned or is themselves */
  const reviewerCanEdit = $derived(
    role === "REVIEWER" &&
      !isCreate &&
      (record?.reviewerId === null || record?.reviewerId === currentEmployeeId),
  );
  const canEditAll = $derived(isCreate || role === "ADMINISTRATOR" || reviewerCanEdit);
  const canEditReview = $derived(isCreate || role === "ADMINISTRATOR" || reviewerCanEdit);
  /** Employees eligible as reviewers (exclude self for REVIEWER role) */
  const reviewerCandidates = $derived(
    role === "REVIEWER" ? employees.filter((e) => e.id !== currentEmployeeId) : employees,
  );

  // ── Editable state ────────────────────────────────────────────────────────
  let traineeId = $state(untrack(() => record?.traineeId ?? currentEmployeeId));
  let reviewerId = $state<number | null>(untrack(() => record?.reviewerId ?? null));
  let trainingCode = $state(untrack(() => record?.trainingCode ?? ""));
  let locationCode = $state(untrack(() => record?.locationCode ?? ""));
  let status = $state<"PENDING" | "APPROVED" | "REJECTED">(
    untrack(() => record?.status ?? "PENDING"),
  );
  let trainingDate = $state<DateValue | undefined>(
    untrack(() => {
      if (!record?.trainingDate) return undefined;
      const d = new Date(record.trainingDate);
      return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }),
  );
  let remarks = $state(untrack(() => record?.remarks ?? ""));

  // ── Derived form attributes ───────────────────────────────────────────────
  const formId = $derived(`record-form-${record?.id ?? "create"}`);
  const formAction = $derived(
    isCreate
      ? `${resolve("/dashboard/training-history")}?/create`
      : `${resolve(`/dashboard/training-history/${record!.id}`)}?/update`,
  );

  // ── Popover / combobox open states ────────────────────────────────────────
  let traineeOpen = $state(false);
  let reviewerOpen = $state(false);
  let calendarOpen = $state(false);

  // ── Derived display labels ────────────────────────────────────────────────
  const traineeName = $derived(employees.find((e) => e.id === traineeId)?.name ?? "");
  const reviewerName = $derived(
    reviewerId ? (employees.find((e) => e.id === reviewerId)?.name ?? "") : "Unassigned",
  );
  const trainingDateLabel = $derived(
    trainingDate
      ? trainingDate.toDate(getLocalTimeZone()).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Pick a date",
  );

  // ── Valibot schema ────────────────────────────────────────────────────────
  const schema = v.object({
    traineeId: v.pipe(v.number("Trainee is required"), v.minValue(1, "Trainee is required")),
    reviewerId: v.nullable(v.number()),
    trainingCode: v.pipe(v.string(), v.nonEmpty("Training is required")),
    locationCode: v.pipe(v.string(), v.nonEmpty("Location is required")),
    status: v.picklist(["PENDING", "APPROVED", "REJECTED"] as const, "Status is required"),
    trainingDate: v.custom<DateValue>((val) => val !== undefined, "Training date is required"),
    remarks: v.optional(v.nullable(v.string())),
  });

  type ErrorMap = Partial<Record<string, string>>;
  let errors = $state<ErrorMap>({});
  let loading = $state(false);

  // ── Form submission ───────────────────────────────────────────────────────
  const handleSubmit: SubmitFunction = ({ formData, cancel }) => {
    const result = v.safeParse(schema, {
      traineeId: selfCreateMode ? currentEmployeeId : traineeId,
      reviewerId: reviewerId,
      trainingCode,
      locationCode,
      status: selfCreateMode ? "PENDING" : status,
      trainingDate,
      remarks: selfCreateMode ? null : remarks || null,
    });

    if (!result.success) {
      const flat = v.flatten(result.issues);
      errors = Object.fromEntries(
        Object.entries(flat.nested ?? {}).map(([k, msgs]) => [k, (msgs as string[])[0] ?? ""]),
      );
      cancel();
      return;
    }

    errors = {};
    formData.set("traineeId", String(selfCreateMode ? currentEmployeeId : traineeId));
    formData.set("reviewerId", reviewerId ? String(reviewerId) : "");
    formData.set("trainingDate", trainingDate!.toDate(getLocalTimeZone()).toISOString());
    if (selfCreateMode) {
      formData.set("status", "PENDING");
      formData.set("remarks", "");
    }
    loading = true;

    return async ({ result }) => {
      loading = false;
      if (result.type === "success") {
        toast.success("Record saved successfully");
        await invalidateAll();
        open = false;
      } else if (result.type === "failure") {
        const serverErrors = (result.data as { errors?: Record<string, string[]> })?.errors ?? {};
        errors = Object.fromEntries(
          Object.entries(serverErrors).map(([k, msgs]) => [k, msgs[0] ?? ""]),
        );
        toast.error("Please fix the errors and try again");
      } else {
        toast.error("An unexpected error occurred");
      }
    };
  };
</script>

<Drawer.Root bind:open direction={isMobile.current ? "bottom" : "right"}>
  <Drawer.Content>
    <Drawer.Header class="gap-1">
      <Drawer.Title
        >{isCreate ? "New Training Record" : `Training Record #${record!.id}`}</Drawer.Title
      >
      <Drawer.Description>
        {#if isCreate}
          Fill in the details below to create a new training record.
        {:else}
          {trainings.find((t) => t.code === trainingCode)?.name ?? trainingCode}
          {#if role === "USER"}
            &mdash; <span class="text-muted-foreground">read-only</span>
          {:else if role === "REVIEWER"}
            &mdash; <span class="text-muted-foreground">reviewer access</span>
          {/if}
        {/if}
      </Drawer.Description>
    </Drawer.Header>

    <div class="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
      <form
        id={formId}
        method="POST"
        action={formAction}
        enctype="multipart/form-data"
        use:enhance={handleSubmit}
        class="flex flex-col gap-4"
      >
        <input type="hidden" name="traineeId" value={traineeId} />
        <input type="hidden" name="reviewerId" value={reviewerId ?? ""} />
        <input type="hidden" name="renewedFromId" value={renewedFromId ?? ""} />
        <input
          type="hidden"
          name="trainingDate"
          value={trainingDate?.toDate(getLocalTimeZone()).toISOString() ?? ""}
        />

        <FieldGroup>
          <!-- Trainee ─────────────────────────────────────────────────── -->
          <Field>
            <FieldLabel>Trainee</FieldLabel>
            {#if selfCreateMode}
              <Input value={traineeName || "You"} disabled />
            {:else}
              <Popover.Root bind:open={traineeOpen}>
                <Popover.Trigger>
                  {#snippet child({ props })}
                    <Button
                      variant="outline"
                      class="w-full justify-between font-normal"
                      aria-expanded={traineeOpen}
                      disabled={!canEditAll}
                      {...props}
                    >
                      {traineeName || "Select trainee…"}
                      <SelectorIcon class="ml-auto size-4 opacity-50" />
                    </Button>
                  {/snippet}
                </Popover.Trigger>
                <Popover.Content class="p-0" align="start">
                  <Command.Root>
                    <Command.Input placeholder="Search employees…" />
                    <Command.List>
                      <Command.Empty>No employee found.</Command.Empty>
                      <Command.Group>
                        {#each employees as emp (emp.id)}
                          <Command.Item
                            value={String(emp.id)}
                            keywords={[emp.name]}
                            onSelect={() => {
                              traineeId = emp.id;
                              traineeOpen = false;
                            }}
                          >
                            {emp.name}
                            {#if traineeId === emp.id}
                              <CheckIcon class="ml-auto size-4" />
                            {/if}
                          </Command.Item>
                        {/each}
                      </Command.Group>
                    </Command.List>
                  </Command.Root>
                </Popover.Content>
              </Popover.Root>
            {/if}
            {#if errors.traineeId}
              <FieldError>{errors.traineeId}</FieldError>
            {/if}
          </Field>

          <!-- Reviewer ────────────────────────────────────────────────── -->
          {#if !selfCreateMode || role === "REVIEWER"}
            <Field>
              <FieldLabel>Reviewer</FieldLabel>
              <Popover.Root bind:open={reviewerOpen}>
                <Popover.Trigger>
                  {#snippet child({ props })}
                    <Button
                      variant="outline"
                      class="w-full justify-between font-normal"
                      aria-expanded={reviewerOpen}
                      disabled={!canEditReview && !selfCreateMode}
                      {...props}
                    >
                      {reviewerName}
                      <SelectorIcon class="ml-auto size-4 opacity-50" />
                    </Button>
                  {/snippet}
                </Popover.Trigger>
                <Popover.Content class="p-0" align="start">
                  <Command.Root>
                    <Command.Input placeholder="Search employees…" />
                    <Command.List>
                      <Command.Empty>No employee found.</Command.Empty>
                      <Command.Group>
                        <Command.Item
                          value="unassigned"
                          keywords={["none", "unassigned", "clear"]}
                          onSelect={() => {
                            reviewerId = null;
                            reviewerOpen = false;
                          }}
                        >
                          Unassigned
                          {#if reviewerId === null}
                            <CheckIcon class="ml-auto size-4" />
                          {/if}
                        </Command.Item>
                        {#each reviewerCandidates as emp (emp.id)}
                          <Command.Item
                            value={String(emp.id)}
                            keywords={[emp.name]}
                            onSelect={() => {
                              reviewerId = emp.id;
                              reviewerOpen = false;
                            }}
                          >
                            {emp.name}
                            {#if reviewerId === emp.id}
                              <CheckIcon class="ml-auto size-4" />
                            {/if}
                          </Command.Item>
                        {/each}
                      </Command.Group>
                    </Command.List>
                  </Command.Root>
                </Popover.Content>
              </Popover.Root>
            </Field>
          {/if}

          <!-- Training ────────────────────────────────────────────────── -->
          <Field>
            <FieldLabel>Training</FieldLabel>
            <Select.Root
              type="single"
              name="trainingCode"
              bind:value={trainingCode}
              disabled={!canEditAll}
            >
              <Select.Trigger class="w-full">
                {trainings.find((t) => t.code === trainingCode)?.name ?? "Select training…"}
              </Select.Trigger>
              <Select.Content>
                {#each trainings as t (t.code)}
                  <Select.Item value={t.code}>{t.name}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
            {#if errors.trainingCode}
              <FieldError>{errors.trainingCode}</FieldError>
            {/if}
          </Field>

          <!-- Location ────────────────────────────────────────────────── -->
          <Field>
            <FieldLabel>Location</FieldLabel>
            <Select.Root
              type="single"
              name="locationCode"
              bind:value={locationCode}
              disabled={!canEditAll}
            >
              <Select.Trigger class="w-full">
                {locations.find((l) => l.code === locationCode)?.name ?? "Select location…"}
              </Select.Trigger>
              <Select.Content>
                {#each locations as loc (loc.code)}
                  <Select.Item value={loc.code}>{loc.name}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
            {#if errors.locationCode}
              <FieldError>{errors.locationCode}</FieldError>
            {/if}
          </Field>

          <!-- Status ──────────────────────────────────────────────────── -->
          {#if !selfCreateMode}
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select.Root
                type="single"
                name="status"
                bind:value={status}
                disabled={!canEditReview}
              >
                <Select.Trigger class="w-full">
                  {{ PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" }[status] ??
                    "Select status…"}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="PENDING">Pending</Select.Item>
                  <Select.Item value="APPROVED">Approved</Select.Item>
                  <Select.Item value="REJECTED">Rejected</Select.Item>
                </Select.Content>
              </Select.Root>
              {#if errors.status}
                <FieldError>{errors.status}</FieldError>
              {/if}
            </Field>
          {/if}

          <!-- Training Date ───────────────────────────────────────────── -->
          <Field>
            <FieldLabel>Training Date</FieldLabel>
            <Popover.Root bind:open={calendarOpen}>
              <Popover.Trigger>
                {#snippet child({ props })}
                  <Button
                    variant="outline"
                    class="w-full justify-start font-normal"
                    disabled={!canEditAll}
                    {...props}
                  >
                    <CalendarIcon class="mr-2 size-4" />
                    {trainingDateLabel}
                  </Button>
                {/snippet}
              </Popover.Trigger>
              <Popover.Content class="w-auto p-0" align="start">
                <Calendar
                  type="single"
                  value={trainingDate}
                  onValueChange={(val) => {
                    trainingDate = val;
                    calendarOpen = false;
                  }}
                />
              </Popover.Content>
            </Popover.Root>
            {#if errors.trainingDate}
              <FieldError>{errors.trainingDate}</FieldError>
            {/if}
          </Field>

          <!-- Remarks ─────────────────────────────────────────────────── -->
          {#if !selfCreateMode}
            <Field>
              <FieldLabel>Remarks</FieldLabel>
              <Textarea
                name="remarks"
                placeholder="Enter any remarks…"
                rows={3}
                disabled={!canEditReview}
                bind:value={remarks}
              />
            </Field>

            <!-- Certificate PDF ─────────────────────────────────────────── -->
            <Field>
              <FieldLabel>Certificate PDF</FieldLabel>
              {#if !isCreate && record!.certificateId}
                <p class="text-xs text-muted-foreground">
                  Existing certificate: <span class="font-mono">{record!.certificateId}</span>
                </p>
              {/if}
              <Input type="file" name="certificate" accept=".pdf" disabled={!canEditReview} />
            </Field>
          {/if}
        </FieldGroup>
      </form>
    </div>

    <Drawer.Footer>
      <Button type="submit" form={formId} disabled={loading || (!isCreate && role === "USER")}>
        {#if loading}
          <Spinner />
        {/if}
        {loading ? "Saving…" : isCreate ? "Create Record" : "Save Changes"}
      </Button>
      <Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
    </Drawer.Footer>
  </Drawer.Content>
</Drawer.Root>
