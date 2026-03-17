<script lang="ts">
  import { getContext } from "svelte";
  import type { Row } from "@tanstack/table-core";
  import type { Schema } from "$lib/components/training-history/schemas";
  import { MediaQuery } from "svelte/reactivity";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Drawer from "$lib/components/ui/drawer";
  import { Button } from "$lib/components/ui/button";
  import { resolve } from "$app/paths";
  import { toast } from "svelte-sonner";
  import DotsVerticalIcon from "@tabler/icons-svelte/icons/dots-vertical";
  import { PDFViewer } from "@embedpdf/svelte-pdf-viewer";
  import { mode } from "mode-watcher";

  let { row }: { row: Row<Schema> } = $props();

  const ctx = getContext<{
    viewDetails: (id: number) => Promise<void>;
    drawerLoading: boolean;
  }>("tableCtx");

  let pdfOpen = $state(false);
  let pdfUrl: string | null = $state(null);
  const isDesktop = new MediaQuery("(min-width: 768px)");

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

  function downloadCertificate() {
    const certId = row.original.certificateId;
    if (!certId) {
      toast.error("No certificate available for this record");
      return;
    }
    // Opens the presigned R2 download URL in a new tab
    window.open(resolve(`/api/certificates/${certId}`), "_blank");
  }

  function getPdfUrl(certId: string): string {
    // Use the view endpoint that proxies the PDF from R2 without CORS issues
    // The view endpoint will natively handle redirecting fake paths to /ebook.pdf
    return resolve(`/api/certificates/${certId}/view`);
  }

  function viewPdf() {
    const certId = row.original.certificateId;
    if (!certId) {
      toast.error("No certificate available for this record");
      return;
    }
    pdfUrl = getPdfUrl(certId);
    pdfOpen = true;
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class="flex size-8 text-muted-foreground data-[state=open]:bg-muted">
    {#snippet child({ props })}
      <Button variant="ghost" size="icon" {...props}>
        <DotsVerticalIcon />
        <span class="sr-only">Open menu</span>
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="w-40">
    <DropdownMenu.Item
      disabled={ctx.drawerLoading}
      onclick={() => ctx.viewDetails(row.original.id)}
    >
      View Details
    </DropdownMenu.Item>
    <DropdownMenu.Item disabled={!row.original.certificateId} onclick={viewPdf}>
      View PDF
    </DropdownMenu.Item>
    <DropdownMenu.Item disabled={!row.original.certificateId} onclick={downloadCertificate}>
      Download Certificate
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item variant="destructive">Delete</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>

{#if isDesktop.current}
  <Dialog.Root bind:open={pdfOpen}>
    <Dialog.Content class="max-w-4xl">
      <Dialog.Header>
        <Dialog.Title>Certificate - {row.original.certificateId}</Dialog.Title>
      </Dialog.Header>
      {#if pdfUrl}
        <div class="min-h-162">
          <PDFViewer
            class="h-full w-full"
            config={{
              src: pdfUrl,
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
              render: { withForms: false, withAnnotations: false },
            }}
          />
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Root>
{:else}
  <Drawer.Root bind:open={pdfOpen}>
    <Drawer.Content>
      <Drawer.Header class="text-start">
        <Drawer.Title>Certificate - {row.original.certificateId}</Drawer.Title>
      </Drawer.Header>
      {#if pdfUrl}
        <div class="h-[70vh] w-full px-4">
          <PDFViewer
            class="h-full"
            config={{
              src: pdfUrl,
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
              render: { withForms: false, withAnnotations: false },
            }}
          />
        </div>
      {/if}
      <Drawer.Footer class="pt-2">
        <Drawer.Close class="w-full">Close</Drawer.Close>
      </Drawer.Footer>
    </Drawer.Content>
  </Drawer.Root>
{/if}
