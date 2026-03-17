<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs";
  import * as Card from "$lib/components/ui/card";
  import { PDFViewer } from "@embedpdf/svelte-pdf-viewer";
  import { SvelteDate } from "svelte/reactivity";
  import { mode } from "mode-watcher";

  const { data } = $props();

  const role = $derived(data.employee?.role || "USER");
  const employeeId = $derived(data.employee?.id);

  const canViewApproved = $derived(role === "REVIEWER" || role === "ADMINISTRATOR");
  const canViewAll = $derived(role === "ADMINISTRATOR");

  let activeTab = $state("my-certificates");

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

  // Helper to categorize certs
  function categorizeCerts(certs: typeof data.certificates) {
    const now = new SvelteDate();
    const IN_90_DAYS = new SvelteDate(now.getTime());
    IN_90_DAYS.setDate(now.getDate() + 90);

    const valid = certs.filter((c) => !c.expiryDate || c.expiryDate > IN_90_DAYS);
    const expiringSoon = certs.filter(
      (c) => c.expiryDate && c.expiryDate <= IN_90_DAYS && c.expiryDate >= now,
    );
    const expired = certs.filter((c) => c.expiryDate && c.expiryDate < now);

    return { valid, expiringSoon, expired };
  }

  // Filter lists based on role requirements
  const myCertificates = $derived(
    categorizeCerts(data.certificates.filter((c) => c.employeeId === employeeId)),
  );
  const approvedCertificates = $derived(
    categorizeCerts(data.certificates.filter((c) => c.reviewerId === employeeId)),
  );
  const allCertificates = $derived(categorizeCerts(data.certificates));

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
    <p class="mt-2 text-muted-foreground">View your certification records.</p>
  </div>

  <Tabs.Root bind:value={activeTab} class="w-full">
    <Tabs.List class="justify-start overflow-x-auto">
      <Tabs.Trigger value="my-certificates">My Certificates</Tabs.Trigger>
      <Tabs.Trigger value="approved-certificates" disabled={!canViewApproved}>
        Approved Certificates
      </Tabs.Trigger>
      <Tabs.Trigger value="all-certificates" disabled={!canViewAll}>All Certificates</Tabs.Trigger>
    </Tabs.List>

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
