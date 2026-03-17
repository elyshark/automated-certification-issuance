<script lang="ts">
  import DarkModeToggle from "$lib/components/common/dark-mode-toggle.svelte";
  import { page } from "$app/stores";

  let { children } = $props();

  const isHome = $derived($page.url.pathname === "/");
</script>

<div
  class={`relative flex min-h-svh flex-col gap-6 bg-background ${
    isHome ? "items-stretch justify-start" : "items-center justify-center"
  } ${isHome ? "p-0" : "p-6 md:p-10"}`}
>
  <div class="absolute top-4 right-4">
    <DarkModeToggle />
  </div>
  <div class={isHome ? "w-full" : "w-full max-w-sm"}>
    {@render children()}
  </div>
</div>
