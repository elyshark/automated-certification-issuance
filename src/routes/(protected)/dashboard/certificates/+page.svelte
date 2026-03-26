<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs";
  import * as Card from "$lib/components/ui/card";
  import * as Drawer from "$lib/components/ui/drawer";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import { PDFViewer } from "@embedpdf/svelte-pdf-viewer";
  import { SvelteDate } from "svelte/reactivity";
  import { mode } from "mode-watcher";
  import { IsMobile } from "$lib/hooks/is-mobile.svelte";

  import FilterIcon from "@lucide/svelte/icons/list-filter";

  const { data } = $props();

  const role = $derived(data.employee?.role || "USER");
  const employeeId = $derived(data.employee?.id);

  const canViewApproved = $derived(role === "ADMINISTRATOR");
  const canViewAll = $derived(role === "ADMINISTRATOR");
  const isReviewer = $derived(role === "REVIEWER");

  let activeTab = $state("my-certificates");
  const isMobile = new IsMobile();
  let filterDrawerOpen = $state(false);

  type FilterState = {
    certId: string;
    training: string;
    status: string;
    employee: string;
  };

  let filters = $state<FilterState>({
    certId: "",
    training: "",
    status: "",
    employee: "",
  });
  let draftFilters = $state<FilterState>({
    certId: "",
    training: "",
    status: "",
    employee: "",
  });

  const pdfTheme = {
    preference: mode.current || "system",
    light: {
      background: {
        app: "var(--background)",
        surface: "var(--card)",
        surfaceAlt: "var(--muted)",
        elevated: "var(--popover)",
        overlay: "oklch(0 0 0 / 0.3)",
        input: "var(--input)",
      },
      foreground: {
        primary: "var(--foreground)",
        secondary: "var(--muted-foreground)",
        muted: "var(--muted-foreground)",
        disabled: "var(--muted-foreground)",
        onAccent: "var(--primary-foreground)",
      },
      border: {
        default: "var(--border)",
        subtle: "var(--border)",
        strong: "var(--border)",
      },
      accent: {
        primary: "var(--primary)",
        primaryHover: "var(--primary)",
        primaryActive: "var(--primary)",
        primaryLight: "var(--accent)",
        primaryForeground: "var(--primary-foreground)",
      },
      interactive: {
        hover: "var(--muted)",
        active: "var(--accent)",
        selected: "var(--accent)",
        focus: "var(--ring)",
        focusRing: "var(--ring)",
      },
      state: {
        error: "var(--destructive)",
        errorLight: "var(--destructive)",
        warning: "var(--chart-4)",
        warningLight: "var(--chart-4)",
        success: "var(--chart-2)",
        successLight: "var(--chart-2)",
        info: "var(--chart-3)",
        infoLight: "var(--chart-3)",
      },
    },
    dark: {
      background: {
        app: "var(--background)",
        surface: "var(--card)",
        surfaceAlt: "var(--muted)",
        elevated: "var(--popover)",
        overlay: "oklch(0 0 0 / 0.6)",
        input: "var(--input)",
      },
      foreground: {
        primary: "var(--foreground)",
        secondary: "var(--muted-foreground)",
        muted: "var(--muted-foreground)",
        disabled: "var(--muted-foreground)",
        onAccent: "var(--primary-foreground)",
      },
      border: {
        default: "var(--border)",
        subtle: "var(--border)",
        strong: "var(--border)",
      },
      accent: {
        primary: "var(--primary)",
        primaryHover: "var(--primary)",
        primaryActive: "var(--primary)",
        primaryLight: "var(--accent)",
        primaryForeground: "var(--primary-foreground)",
      },
      interactive: {
        hover: "var(--muted)",
        active: "var(--accent)",
        selected: "var(--accent)",
        focus: "var(--ring)",
        focusRing: "var(--ring)",
      },
      state: {
        error: "var(--destructive)",
        errorLight: "var(--destructive)",
        warning: "var(--chart-4)",
        warningLight: "var(--chart-4)",
        success: "var(--chart-2)",
        successLight: "var(--chart-2)",
        info: "var(--chart-3)",
        infoLight: "var(--chart-3)",
      },
    },
  };

  const trainingOptions = $derived(
    Array.from(new Set(data.certificates.map((cert) => cert.trainingName))).sort((a, b) =>
      a.localeCompare(b),
    ),
  );
  const employeeOptions = $derived(
    Array.from(
      new Set(
        data.certificates.map((cert) =>
          `${cert.employeeGivenName ?? ""} ${cert.employeeSurname ?? ""}`.trim(),
        ),
      ),
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b)),
  );
  const statusOptions = ["valid", "expiring", "expired"] as const;

  const activeFilterCount = $derived(
    [
      filters.certId ? 1 : 0,
      filters.training ? 1 : 0,
      filters.status ? 1 : 0,
      filters.employee ? 1 : 0,
    ].reduce((total, value) => total + value, 0),
  );

  function formatEmployeeName(cert: (typeof data.certificates)[0]) {
    return `${cert.employeeGivenName ?? ""} ${cert.employeeSurname ?? ""}`.trim();
  }

  function applyFilters() {
    filters = { ...draftFilters };
  }

  function clearFilters() {
    const cleared = {
      certId: "",
      training: "",
      status: "",
      employee: "",
    };
    filters = { ...cleared };
    draftFilters = { ...cleared };
  }

  $effect(() => {
    if (!filterDrawerOpen) return;
    draftFilters = { ...filters };
  });

  function getCertStatus(
    cert: (typeof data.certificates)[0],
    now: SvelteDate,
    in90Days: SvelteDate,
  ) {
    if (!cert.expiryDate || cert.expiryDate > in90Days) return "valid";
    if (cert.expiryDate >= now) return "expiring";
    return "expired";
  }

  // Helper to categorize certs
  function categorizeCerts(certs: typeof data.certificates) {
    const now = new SvelteDate();
    const IN_90_DAYS = new SvelteDate(now.getTime());
    IN_90_DAYS.setDate(now.getDate() + 90);

    const valid: typeof certs = [];
    const expiringSoon: typeof certs = [];
    const expired: typeof certs = [];

    for (const cert of certs) {
      const status = getCertStatus(cert, now, IN_90_DAYS);
      if (status === "valid") valid.push(cert);
      else if (status === "expiring") expiringSoon.push(cert);
      else expired.push(cert);
    }

    return { valid, expiringSoon, expired };
  }

  function filterCerts(certs: typeof data.certificates) {
    const now = new SvelteDate();
    const IN_90_DAYS = new SvelteDate(now.getTime());
    IN_90_DAYS.setDate(now.getDate() + 90);

    return certs.filter((cert) => {
      if (filters.certId && !cert.id.toLowerCase().includes(filters.certId.trim().toLowerCase())) {
        return false;
      }
      if (filters.training && cert.trainingName !== filters.training) {
        return false;
      }
      if (filters.employee && formatEmployeeName(cert) !== filters.employee) {
        return false;
      }
      if (filters.status) {
        const status = getCertStatus(cert, now, IN_90_DAYS);
        if (status !== filters.status) return false;
      }
      return true;
    });
  }

  // Filter lists based on role requirements
  const myCertificates = $derived(
    categorizeCerts(
      filterCerts(
        isReviewer
          ? data.certificates
          : data.certificates.filter((c) => c.employeeId === employeeId),
      ),
    ),
  );
  const approvedCertificates = $derived(
    categorizeCerts(filterCerts(data.certificates.filter((c) => c.reviewerId === employeeId))),
  );
  const allCertificates = $derived(categorizeCerts(filterCerts(data.certificates)));

  // URL formatting
  function getPdfUrl(certPath: string, certId: string) {
    if (certPath.startsWith("https://fakeurl.com/")) {
      return `/ebook.pdf`;
    }
    return `/api/certificates/${certId}/view`;
  }

  function getFormattedDescription(cert: (typeof data.certificates)[0]) {
    if (!cert.expiryDate) return "No Expiry Date";
    const status = cert.expiryDate < new SvelteDate() ? "Expired on" : "Expires on";
    return `${status} ${cert.expiryDate.toLocaleDateString()}`;
  }
</script>

<div class="@container/main flex flex-col space-y-6 p-4 md:p-6">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Certificates</h1>
    <p class="mt-2 text-muted-foreground">
      {isReviewer
        ? "View certificates for your approved locations."
        : "View your certification records."}
    </p>
  </div>

  <Drawer.Root bind:open={filterDrawerOpen} direction={isMobile.current ? "bottom" : "right"}>
    <Drawer.Content>
      <Drawer.Header class="gap-1">
        <Drawer.Title>Filter Certificates</Drawer.Title>
        <Drawer.Description>Refine certificates by ID, status, or issuer.</Drawer.Description>
      </Drawer.Header>

      <div class="flex flex-col gap-4 px-4">
        <div class="flex flex-col gap-2">
          <Label for="cert-id">Certificate ID</Label>
          <Input id="cert-id" placeholder="e.g. II-KUL-001" bind:value={draftFilters.certId} />
        </div>

        <div class="flex flex-col gap-2">
          <Label for="cert-training">Training</Label>
          <Select.Root type="single" bind:value={draftFilters.training}>
            <Select.Trigger id="cert-training" class="w-full">
              <span class="truncate">{draftFilters.training || "All trainings"}</span>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="">All trainings</Select.Item>
              {#each trainingOptions as training (training)}
                <Select.Item value={training}>{training}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <div class="flex flex-col gap-2">
          <Label for="cert-status">Status</Label>
          <Select.Root type="single" bind:value={draftFilters.status}>
            <Select.Trigger id="cert-status" class="w-full">
              <span class="truncate">{draftFilters.status || "All statuses"}</span>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="">All statuses</Select.Item>
              {#each statusOptions as status (status)}
                <Select.Item value={status}>{status}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <div class="flex flex-col gap-2">
          <Label for="cert-employee">Issued To</Label>
          <Select.Root type="single" bind:value={draftFilters.employee}>
            <Select.Trigger id="cert-employee" class="w-full">
              <span class="truncate">{draftFilters.employee || "All employees"}</span>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="">All employees</Select.Item>
              {#each employeeOptions as employee (employee)}
                <Select.Item value={employee}>{employee}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      </div>

      <Drawer.Footer class="px-4 pt-2 pb-4">
        <div class="flex items-center justify-between">
          <Button variant="outline" onclick={clearFilters}>Clear filters</Button>
          <Button
            onclick={() => {
              applyFilters();
              filterDrawerOpen = false;
            }}
          >
            Apply filters
          </Button>
        </div>
      </Drawer.Footer>
    </Drawer.Content>
  </Drawer.Root>

  <Tabs.Root bind:value={activeTab} class="w-full">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <Tabs.List class="justify-start overflow-x-auto">
        <Tabs.Trigger value="my-certificates">
          {isReviewer ? "Location Certificates" : "My Certificates"}
        </Tabs.Trigger>
        <Tabs.Trigger value="approved-certificates" disabled={!canViewApproved}>
          Approved Certificates
        </Tabs.Trigger>
        <Tabs.Trigger value="all-certificates" disabled={!canViewAll}>All Certificates</Tabs.Trigger
        >
      </Tabs.List>
      <Button variant="outline" size="sm" onclick={() => (filterDrawerOpen = true)}>
        <FilterIcon />
        Filters
        {#if activeFilterCount > 0}
          <span class="ms-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
            {activeFilterCount}
          </span>
        {/if}
      </Button>
    </div>

    <Tabs.Content value="my-certificates" class="mt-6 space-y-10">
      {@render certificateGroup("Valid", myCertificates.valid, "my-certificates")}
      {@render certificateGroup("Expiring Soon", myCertificates.expiringSoon, "my-certificates")}
      {@render certificateGroup("Expired", myCertificates.expired, "my-certificates")}
    </Tabs.Content>

    {#if canViewApproved}
      <Tabs.Content value="approved-certificates" class="mt-6 space-y-10">
        {@render certificateGroup("Valid", approvedCertificates.valid, "approved-certificates")}
        {@render certificateGroup(
          "Expiring Soon",
          approvedCertificates.expiringSoon,
          "approved-certificates",
        )}
        {@render certificateGroup("Expired", approvedCertificates.expired, "approved-certificates")}
      </Tabs.Content>
    {/if}

    {#if canViewAll}
      <Tabs.Content value="all-certificates" class="mt-6 space-y-10">
        {@render certificateGroup("Valid", allCertificates.valid, "all-certificates")}
        {@render certificateGroup(
          "Expiring Soon",
          allCertificates.expiringSoon,
          "all-certificates",
        )}
        {@render certificateGroup("Expired", allCertificates.expired, "all-certificates")}
      </Tabs.Content>
    {/if}
  </Tabs.Root>
</div>

{#snippet certificateGroup(title: string, certificates: typeof data.certificates, tabValue: string)}
  <div>
    <div class="mb-4">
      <h2 class="text-2xl font-semibold tracking-tight">{title}</h2>
      <hr class="mt-2" />
    </div>

    {#if certificates.length === 0}
      <div class="text-sm text-muted-foreground italic">
        No {title.toLowerCase()} certificates found.
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {#each certificates as cert (cert.id)}
          <Card.Root class="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
            <Card.Header>
              <Card.Title title={cert.trainingName}>
                {cert.id} - {cert.trainingName}
              </Card.Title>
              <Card.Description>{getFormattedDescription(cert)}</Card.Description>
            </Card.Header>
            <Card.Content class="relative min-h-125 flex-1 border-t bg-muted/10 p-0">
              <div class="absolute inset-0">
                {#if activeTab === tabValue}
                  {#key cert.id}
                    <PDFViewer
                      config={{
                        src: getPdfUrl(cert.path, cert.id),
                        theme: pdfTheme,
                        disabledCategories: [
                          "annotation",
                          "redaction",
                          "history",
                          "capture",
                          "sidebar",
                          "attachment",
                          "bookmark",
                        ],
                        permissions: {
                          overrides: {
                            modifyContents: false,
                            fillForms: false,
                            modifyAnnotations: false,
                            assembleDocument: false,
                          },
                        },
                        render: {
                          withForms: false,
                          withAnnotations: false,
                        },
                      }}
                      class="h-full w-full"
                    />
                  {/key}
                {/if}
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    {/if}
  </div>
{/snippet}
