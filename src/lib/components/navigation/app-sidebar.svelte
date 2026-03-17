<script lang="ts">
  import NavMain from "$lib/components/navigation/nav-main.svelte";
  import NavSecondary from "$lib/components/navigation/nav-secondary.svelte";
  import NavUser from "$lib/components/navigation/nav-user.svelte";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import type { ComponentProps } from "svelte";
  import { page } from "$app/state";
  import logo from "$lib/assets/header_logo.png";
  import LifeBuoyIcon from "@lucide/svelte/icons/life-buoy";
  import SendIcon from "@lucide/svelte/icons/send";
  import FileCheckIcon from "@lucide/svelte/icons/file-check";
  import DashboardIcon from "@lucide/svelte/icons/layout-dashboard";
  import UserStarIcon from "@lucide/svelte/icons/user-star";
  import { resolve } from "$app/paths";

  const data = $state({
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: DashboardIcon,
        isExpanded: true,
        items: [
          {
            title: "Training History",
            url: "/dashboard/training-history",
          },
          {
            title: "Certificates",
            url: "/dashboard/certificates",
          },
        ],
      },
      {
        title: "Administration",
        url: "/admin",
        icon: UserStarIcon,
        isExpanded: true,
        items: [
          {
            title: "Users",
            url: "/admin/users",
          },
          {
            title: "Locations",
            url: "/admin/locations",
          },
        ],
      },
      {
        title: "Review",
        url: "/review",
        icon: FileCheckIcon,
        isExpanded: true,
        items: [
          {
            title: "Queue",
            url: "/review/queue",
          },
          {
            title: "Record",
            url: "/review/record",
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: "Support",
        url: "mailto:elysha_22008629@utp.edu.my?subject=Support%20Request&body=Please%20describe%20your%20issue",
        icon: LifeBuoyIcon,
      },
      {
        title: "Feedback",
        url: "mailto:elysha_22008629@utp.edu.my?subject=Feedback%2FSuggestions&body=Please%20describe%20your%20feedback%2Fsuggestions",
        icon: SendIcon,
      },
    ],
  });

  let currentUser = $derived({
    name: page.data.user?.name,
    email: page.data.user?.email,
    avatar: page.data.user?.image || undefined,
  });

  let role = $derived(page.data.employee?.role || "USER");

  let filteredNavMain = $derived(
    data.navMain.filter((item) => {
      if (item.title === "Administration") return role === "ADMINISTRATOR";
      if (item.title === "Review") return role === "ADMINISTRATOR" || role === "REVIEWER";
      return true;
    }),
  );

  let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref variant="inset" {...restProps}>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg">
          {#snippet child({ props })}
            <a href={resolve("/dashboard")} {...props}>
              <div
                class="flex aspect-square size-8 items-center justify-center rounded-md p-1 text-sidebar-primary-foreground dark:bg-sidebar-foreground"
              >
                <img src={logo} alt="PETRONAS logo" />
              </div>
              <div class="grid flex-1 text-start text-sm leading-tight">
                <span class="truncate font-medium">PETRONAS</span>
                <span class="truncate text-xs">Aviation</span>
              </div>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    <NavMain items={filteredNavMain} />
    <NavSecondary items={data.navSecondary} class="mt-auto" />
  </Sidebar.Content>
  <Sidebar.Footer>
    <NavUser user={currentUser} />
  </Sidebar.Footer>
</Sidebar.Root>
