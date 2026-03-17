<script lang="ts">
  import { onMount } from "svelte";
  import mapboxgl from "mapbox-gl";
  import "mapbox-gl/dist/mapbox-gl.css";
  import { mode } from "mode-watcher";
  import { PUBLIC_MAPBOX_TOKEN } from "$env/static/public";
  import * as Popover from "$lib/components/ui/popover";

  type MapPoint = {
    code: string;
    name: string;
    latitude: number;
    longitude: number;
    receivedCount: number;
    approvedCount: number;
    allCount: number;
  };

  let { points = [] }: { points?: MapPoint[] } = $props();

  let mapContainer: HTMLDivElement;
  let map = $state<mapboxgl.Map | null>(null);
  let currentStyle = "";
  let projectedPoints = $state<Array<MapPoint & { x: number; y: number }>>([]);
  let activePoint = $state<MapPoint | null>(null);

  const lightStyle = "mapbox://styles/mapbox/light-v11";
  const darkStyle = "mapbox://styles/mapbox/dark-v11";

  function getStyle() {
    const theme = mode.current;
    return theme === "dark" ? darkStyle : lightStyle;
  }

  function updateProjections() {
    if (!map) return;
    projectedPoints = points.map((point) => {
      const projected = map!.project([point.longitude, point.latitude]);
      return { ...point, x: projected!.x, y: projected!.y };
    });
  }

  onMount(() => {
    if (!PUBLIC_MAPBOX_TOKEN) {
      console.error("Missing PUBLIC_MAPBOX_TOKEN for Mapbox.");
      return;
    }

    mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;

    currentStyle = getStyle();
    map = new mapboxgl.Map({
      container: mapContainer,
      style: currentStyle,
      center: [54.3773, 24.4539],
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");

    const handleMove = () => updateProjections();
    map.on("move", handleMove);
    map.on("zoom", handleMove);
    map.on("moveend", handleMove);
    map.on("style.load", handleMove);
    map.on("click", () => {
      activePoint = null;
    });

    return () => {
      map?.off("move", handleMove);
      map?.off("zoom", handleMove);
      map?.off("moveend", handleMove);
      map?.off("style.load", handleMove);
      map?.remove();
      map = null;
    };
  });

  $effect(() => {
    if (!map) return;
    const nextStyle = getStyle();
    if (nextStyle === currentStyle) return;
    currentStyle = nextStyle;
    map.setStyle(currentStyle);
  });

  $effect(() => {
    if (!map) return;
    if (!points.length) {
      projectedPoints = [];
      activePoint = null;
      return;
    }

    updateProjections();

    const bounds = new mapboxgl.LngLatBounds();
    for (const point of points) {
      bounds.extend([point.longitude, point.latitude]);
    }

    if (points.length === 1) {
      map.easeTo({ center: bounds.getCenter(), zoom: 10 });
    } else {
      map.fitBounds(bounds, { padding: 60, maxZoom: 11 });
    }
  });

  const showReceived = $derived(points.some((p) => p.receivedCount > 0));
  const showApproved = $derived(points.some((p) => p.approvedCount > 0));
  const showAll = $derived(points.some((p) => p.allCount > 0));
</script>

<div class="relative h-full w-full">
  <div class="absolute inset-0 h-full w-full" bind:this={mapContainer}></div>
  <div class="pointer-events-none absolute inset-0">
    {#each projectedPoints as point (point.code)}
      <div
        class="pointer-events-auto absolute -translate-x-1/2 -translate-y-full"
        style={`left: ${point.x}px; top: ${point.y}px;`}
      >
        {@render Marker({ point })}
      </div>
    {/each}
  </div>
  <div
    class="absolute top-4 left-4 flex gap-3 rounded-full border-2 bg-background px-3 py-2 text-xs shadow-2xl"
  >
    {#if showReceived}
      <div class="inline-flex items-center gap-1.5">
        <span class="inline-block h-2.5 w-2.5 rounded-full bg-blue-500"></span>
        <span>Received</span>
      </div>
    {/if}
    {#if showApproved}
      <div class="inline-flex items-center gap-1.5">
        <span class="inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>
        <span>Approved</span>
      </div>
    {/if}
    {#if showAll}
      <div class="inline-flex items-center gap-1.5">
        <span class="inline-block h-2.5 w-2.5 rounded-full bg-amber-500"></span>
        <span>All</span>
      </div>
    {/if}
  </div>
</div>

{#snippet Marker({ point }: { point: MapPoint })}
  <Popover.Root
    open={activePoint?.code === point.code}
    onOpenChange={(open) => {
      if (open) activePoint = point;
      else if (activePoint?.code === point.code) activePoint = null;
    }}
  >
    <Popover.Trigger>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-full border-2 bg-background px-2 py-1.5 shadow-2xl"
        aria-label={`${point.name} (${point.code})`}
        onclick={(event) => {
          event.stopPropagation();
          activePoint = point;
        }}
      >
        <div class="inline-flex gap-1.5">
          {#if point.receivedCount > 0}
            <span class="inline-block h-2.5 w-2.5 rounded-full bg-blue-500"></span>
          {/if}
          {#if point.approvedCount > 0}
            <span class="inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>
          {/if}
          {#if point.allCount > 0}
            <span class="inline-block h-2.5 w-2.5 rounded-full bg-amber-500"></span>
          {/if}
          {#if point.receivedCount === 0 && point.approvedCount === 0 && point.allCount === 0}
            <span class="inline-block h-2.5 w-2.5 rounded-full bg-[#94a3b8]"></span>
          {/if}
        </div>
      </button>
    </Popover.Trigger>
    <Popover.Content align="center" side="top" sideOffset={12} class="p-0">
      {@render Popup({ point })}
    </Popover.Content>
  </Popover.Root>
{/snippet}

{#snippet Popup({ point }: { point: MapPoint })}
  <div class="rounded-sm border bg-popover p-3 text-popover-foreground shadow-md">
    <div class="flex items-start justify-between gap-2">
      <div class="text-sm font-semibold">{point.name}</div>
      <div class="rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide">
        {point.code}
      </div>
    </div>
    <div class="mt-2 space-y-1 text-xs text-muted-foreground">
      {#if point.receivedCount > 0}
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-1">
            <span class="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
            Received
          </span>
          <span class="font-semibold text-foreground">{point.receivedCount}</span>
        </div>
      {/if}
      {#if point.approvedCount > 0}
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-1">
            <span class="inline-block h-2 w-2 rounded-full bg-green-500"></span>
            Approved
          </span>
          <span class="font-semibold text-foreground">{point.approvedCount}</span>
        </div>
      {/if}
      {#if point.allCount > 0}
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-1">
            <span class="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
            All
          </span>
          <span class="font-semibold text-foreground">{point.allCount}</span>
        </div>
      {/if}
      {#if point.receivedCount === 0 && point.approvedCount === 0 && point.allCount === 0}
        <div class="text-xs">No records</div>
      {/if}
    </div>
  </div>
{/snippet}

<style>
  :global(.mapboxgl-popup) {
    max-width: 220px;
  }

  :global(.mapboxgl-ctrl-top-right) {
    top: 12px;
    right: 12px;
  }
</style>
