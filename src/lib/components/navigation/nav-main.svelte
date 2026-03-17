<script lang="ts">
  import * as Collapsible from "$lib/components/ui/collapsible";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import { resolve } from "$app/paths";
  import type { Component } from "svelte";

  let {
    items,
  }: {
    items: {
      title: string;
      url: string;
      icon: Component;
      isExpanded: boolean;
      items?: {
        title: string;
        url: string;
      }[];
    }[];
  } = $props();
</script>

<Sidebar.Group>
  <Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#each items as mainItem (mainItem.title)}
      <Collapsible.Root bind:open={mainItem.isExpanded}>
        {#snippet child({ props })}
          <Sidebar.MenuItem {...props}>
            <Sidebar.MenuButton tooltipContent={mainItem.title}>
              {#snippet child({ props })}
                <a href={resolve(mainItem.url)} {...props}>
                  <mainItem.icon />
                  <span>{mainItem.title}</span>
                </a>
              {/snippet}
            </Sidebar.MenuButton>
            {#if mainItem.items?.length}
              <Collapsible.Trigger>
                {#snippet child({ props })}
                  <Sidebar.MenuAction {...props} class="data-[state=open]:rotate-90">
                    <ChevronRightIcon />
                    <span class="sr-only">Toggle</span>
                  </Sidebar.MenuAction>
                {/snippet}
              </Collapsible.Trigger>
              <Collapsible.Content>
                <Sidebar.MenuSub>
                  {#each mainItem.items as subItem (subItem.title)}
                    <Sidebar.MenuSubItem>
                      <Sidebar.MenuSubButton href={resolve(subItem.url)}>
                        <span>{subItem.title}</span>
                      </Sidebar.MenuSubButton>
                    </Sidebar.MenuSubItem>
                  {/each}
                </Sidebar.MenuSub>
              </Collapsible.Content>
            {/if}
          </Sidebar.MenuItem>
        {/snippet}
      </Collapsible.Root>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>
