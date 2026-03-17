<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import { resolve } from "$app/paths";
  import type { SubmitFunction } from "@sveltejs/kit";
  import * as v from "valibot";
  import * as Drawer from "$lib/components/ui/drawer";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { toast } from "svelte-sonner";
  import type { Schema } from "$lib/components/admin/locations/schemas";
  import { IsMobile } from "$lib/hooks/is-mobile.svelte";

  let { open = $bindable(false), record = null }: { open: boolean; record?: Schema | null } =
    $props();

  const isMobile = new IsMobile();
  const isCreate = $derived(record == null);

  let code = $state("");
  let name = $state("");
  let latitude = $state("");
  let longitude = $state("");

  $effect(() => {
    code = record?.code ?? "";
    name = record?.name ?? "";
    latitude = record?.latitude ?? "";
    longitude = record?.longitude ?? "";
  });

  const formAction = $derived(
    isCreate ? `${resolve("/admin/locations")}?/create` : `${resolve("/admin/locations")}?/update`,
  );

  const schema = v.object({
    code: v.pipe(v.string("Code is required"), v.nonEmpty("Code is required"), v.length(3)),
    name: v.pipe(v.string("Name is required"), v.nonEmpty("Name is required")),
    latitude: v.optional(
      v.nullable(v.pipe(v.string(), v.regex(/^-?\d{1,3}(?:\.\d{1,7})?$/, "Invalid latitude"))),
    ),
    longitude: v.optional(
      v.nullable(v.pipe(v.string(), v.regex(/^-?\d{1,3}(?:\.\d{1,7})?$/, "Invalid longitude"))),
    ),
  });

  type ErrorMap = Partial<Record<string, string>>;
  let errors = $state<ErrorMap>({});
  let loading = $state(false);

  const handleSubmit: SubmitFunction = ({ formData, cancel }) => {
    const result = v.safeParse(schema, {
      code,
      name,
      latitude: latitude || null,
      longitude: longitude || null,
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
    formData.set("code", code);
    formData.set("name", name);
    formData.set("latitude", latitude || "");
    formData.set("longitude", longitude || "");

    loading = true;

    return async ({ result }) => {
      loading = false;
      if (result.type === "success") {
        toast.success(isCreate ? "Location created" : "Location updated");
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
      <Drawer.Title>{isCreate ? "New Location" : `Location ${code}`}</Drawer.Title>
      <Drawer.Description>
        {#if isCreate}
          Add a new location and its coordinates.
        {:else}
          Update the location details.
        {/if}
      </Drawer.Description>
    </Drawer.Header>

    <form
      class="flex flex-col gap-4 px-4"
      method="post"
      action={formAction}
      use:enhance={handleSubmit}
    >
      <div class="flex flex-col gap-2">
        <Label for="code">Code</Label>
        <Input id="code" name="code" bind:value={code} maxlength={3} readonly={!isCreate} />
        {#if errors.code}
          <p class="text-sm text-destructive">{errors.code}</p>
        {/if}
      </div>

      <div class="flex flex-col gap-2">
        <Label for="name">Name</Label>
        <Input id="name" name="name" bind:value={name} />
        {#if errors.name}
          <p class="text-sm text-destructive">{errors.name}</p>
        {/if}
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-2">
          <Label for="latitude">Latitude</Label>
          <Input id="latitude" name="latitude" bind:value={latitude} placeholder="e.g. 25.2048" />
          {#if errors.latitude}
            <p class="text-sm text-destructive">{errors.latitude}</p>
          {/if}
        </div>
        <div class="flex flex-col gap-2">
          <Label for="longitude">Longitude</Label>
          <Input
            id="longitude"
            name="longitude"
            bind:value={longitude}
            placeholder="e.g. 55.2708"
          />
          {#if errors.longitude}
            <p class="text-sm text-destructive">{errors.longitude}</p>
          {/if}
        </div>
      </div>

      <div class="flex items-center gap-2 py-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
        <Drawer.Close>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>Cancel</Button>
          {/snippet}
        </Drawer.Close>
      </div>
    </form>
  </Drawer.Content>
</Drawer.Root>
