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
  import * as Select from "$lib/components/ui/select";
  import { toast } from "svelte-sonner";
  import type { Schema } from "$lib/components/admin/users/schemas";
  import { IsMobile } from "$lib/hooks/is-mobile.svelte";

  let { open = $bindable(false), record = null }: { open: boolean; record?: Schema | null } =
    $props();

  const isMobile = new IsMobile();
  const isCreate = $derived(record == null);

  let id = $state<number | null>(null);
  let givenName = $state("");
  let surname = $state("");
  let email = $state("");
  let position = $state("");
  let role = $state<"USER" | "REVIEWER" | "ADMINISTRATOR">("USER");

  $effect(() => {
    id = record?.id ?? null;
    givenName = record?.givenName ?? "";
    surname = record?.surname ?? "";
    email = record?.email ?? "";
    position = record?.position ?? "";
    role = record?.role ?? "USER";
  });

  const formAction = $derived(
    isCreate ? `${resolve("/admin/users")}?/create` : `${resolve("/admin/users")}?/update`,
  );

  const schema = v.object({
    givenName: v.pipe(v.string("First name is required"), v.nonEmpty("First name is required")),
    surname: v.pipe(v.string("Last name is required"), v.nonEmpty("Last name is required")),
    email: v.pipe(v.string("Email is required"), v.nonEmpty("Email is required"), v.email()),
    position: v.pipe(v.string("Position is required"), v.nonEmpty("Position is required")),
    role: v.picklist(["USER", "REVIEWER", "ADMINISTRATOR"] as const),
  });

  type ErrorMap = Partial<Record<string, string>>;
  let errors = $state<ErrorMap>({});
  let loading = $state(false);

  const handleSubmit: SubmitFunction = ({ formData, cancel }) => {
    const result = v.safeParse(schema, {
      givenName,
      surname,
      email,
      position,
      role,
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
    if (id != null) formData.set("id", String(id));
    formData.set("givenName", givenName);
    formData.set("surname", surname);
    formData.set("email", email);
    formData.set("position", position);
    formData.set("role", role);

    loading = true;

    return async ({ result }) => {
      loading = false;
      if (result.type === "success") {
        toast.success(isCreate ? "User created" : "User updated");
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
      <Drawer.Title>
        {#if isCreate}
          New User
        {:else}
          {givenName} {surname}
        {/if}
      </Drawer.Title>
      <Drawer.Description>
        {#if isCreate}
          Create a new user and assign a role.
        {:else}
          Update the user details.
        {/if}
      </Drawer.Description>
    </Drawer.Header>

    <form
      class="flex flex-col gap-4 px-4"
      method="post"
      action={formAction}
      use:enhance={handleSubmit}
    >
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-2">
          <Label for="givenName">First Name</Label>
          <Input id="givenName" name="givenName" bind:value={givenName} />
          {#if errors.givenName}
            <p class="text-sm text-destructive">{errors.givenName}</p>
          {/if}
        </div>
        <div class="flex flex-col gap-2">
          <Label for="surname">Last Name</Label>
          <Input id="surname" name="surname" bind:value={surname} />
          {#if errors.surname}
            <p class="text-sm text-destructive">{errors.surname}</p>
          {/if}
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <Label for="email">Email</Label>
        <Input id="email" name="email" bind:value={email} />
        {#if errors.email}
          <p class="text-sm text-destructive">{errors.email}</p>
        {/if}
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-2">
          <Label for="position">Position</Label>
          <Input id="position" name="position" bind:value={position} />
          {#if errors.position}
            <p class="text-sm text-destructive">{errors.position}</p>
          {/if}
        </div>
        <div class="flex flex-col gap-2">
          <Label for="role">Role</Label>
          <Select.Root type="single" bind:value={role}>
            <Select.Trigger id="role" class="w-full">
              {role}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="USER">USER</Select.Item>
              <Select.Item value="REVIEWER">REVIEWER</Select.Item>
              <Select.Item value="ADMINISTRATOR">ADMINISTRATOR</Select.Item>
            </Select.Content>
          </Select.Root>
          {#if errors.role}
            <p class="text-sm text-destructive">{errors.role}</p>
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
