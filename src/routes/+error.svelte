<script lang="ts">
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import AlertTriangle from "@lucide/svelte/icons/alert-triangle";
  import FileQuestion from "@lucide/svelte/icons/file-question";
  import ShieldAlert from "@lucide/svelte/icons/shield-alert";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import DarkModeToggle from "$lib/components/common/dark-mode-toggle.svelte";

  const status = $derived(page.status);
  const message = $derived(page.error?.message || "An unexpected error occurred.");

  const title = $derived(
    status === 404 ? "Page Not Found" : status === 403 ? "Access Denied" : "Something went wrong",
  );

  const description = $derived(
    status === 404
      ? "Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist."
      : status === 403
        ? "You don't have permission to access this resource. Please contact your administrator if you believe this is a mistake."
        : message,
  );
</script>

<div class="relative flex min-h-[70vh] flex-1 flex-col items-center justify-center p-4 text-center">
  <div class="absolute top-4 right-4">
    <DarkModeToggle />
  </div>

  <div class="mb-8 rounded-full bg-muted/50 p-6">
    {#if status === 404}
      <FileQuestion class="h-16 w-16 text-muted-foreground" />
    {:else if status === 403}
      <ShieldAlert class="h-16 w-16 text-destructive" />
    {:else}
      <AlertTriangle class="h-16 w-16 text-destructive" />
    {/if}
  </div>

  <h1 class="mb-4 text-6xl font-extrabold tracking-tight text-primary">
    {status}
  </h1>

  <h2 class="mb-4 text-3xl font-semibold tracking-tight">
    {title}
  </h2>

  <p class="mb-8 max-w-md text-lg text-muted-foreground">
    {description}
  </p>

  <div class="flex gap-4">
    <Button variant="outline" class="gap-2" onclick={() => history.back()}>
      <ArrowLeft class="h-4 w-4" />
      Go Back
    </Button>
    <Button href="/dashboard">Return Home</Button>
  </div>
</div>
