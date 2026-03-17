<script lang="ts">
  import AppSidebar from "$lib/components/navigation/app-sidebar.svelte";
  import DarkModeToggle from "$lib/components/common/dark-mode-toggle.svelte";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb";
  import { Separator } from "$lib/components/ui/separator";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import { page } from "$app/state";

  let { children } = $props();

  let segments = $derived(
    page.url.pathname
      .split("/")
      .filter(Boolean)
      .map((segment, index, arr) => ({
        label: segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        href: "/" + arr.slice(0, index + 1).join("/"),
        isLast: index === arr.length - 1,
      })),
  );
</script>

<Sidebar.Provider>
  <AppSidebar />
  <Sidebar.Inset>
    <header class="flex h-16 shrink-0 items-center justify-between gap-2 px-4">
      <div class="flex items-center gap-2">
        <Sidebar.Trigger class="-ms-1" />
        <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb.Root>
          <Breadcrumb.List>
            {#each segments as segment (segment.href)}
              {#if segment.isLast}
                <Breadcrumb.Item>
                  <Breadcrumb.Page>{segment.label}</Breadcrumb.Page>
                </Breadcrumb.Item>
              {:else}
                <Breadcrumb.Item class="hidden md:block">
                  <Breadcrumb.Link href={segment.href}>{segment.label}</Breadcrumb.Link>
                </Breadcrumb.Item>
                <Breadcrumb.Separator class="hidden md:block" />
              {/if}
            {/each}
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </div>
      <DarkModeToggle />
    </header>
    <main class="flex flex-1 flex-col gap-4 p-4 pt-0">
      {@render children()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>
