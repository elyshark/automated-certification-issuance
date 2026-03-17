<script lang="ts">
  import aviation1 from "$lib/assets/aviation-1.jpg";
  import aviation2 from "$lib/assets/aviation-2.jpg";
  import aviation3 from "$lib/assets/aviation-3.jpg";
  import { resolve } from "$app/paths";
  import favicon from "$lib/assets/favicon.ico";

  const currentYear = new Date().getFullYear();
</script>

<main
  class="w-full bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.08),transparent_30%)] text-foreground dark:bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.12),transparent_50%),linear-gradient(180deg,rgba(15,23,42,0.35),transparent_35%)]"
>
  <section class="px-6 pt-16 pb-14 lg:px-16 xl:px-24">
    <div class="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p class="text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
          Automated Certification Issuance
        </p>
        <h1 class="mt-4 text-4xl leading-[1.05] font-semibold tracking-tight lg:text-6xl">
          Certify aviation training
          <span class="block text-[oklch(0.398_0.07_227.392)] dark:text-[oklch(0.769_0.188_70.08)]">
            without the paperwork drag.
          </span>
        </h1>
        <p class="mt-6 text-lg leading-relaxed text-muted-foreground">
          A single system for trainees, reviewers, and administrators to track training history,
          approve records, and issue certificates in minutes.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a
            class="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg"
            href={resolve("/login")}
          >
            Get Started
          </a>
          <a
            class="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground"
            href={resolve("/signup")}
          >
            Request Access
          </a>
        </div>
        <div class="mt-10 grid grid-cols-3 gap-6">
          <div>
            <span class="text-2xl font-semibold">3x</span>
            <span class="mt-1 block text-xs text-muted-foreground">Faster approvals</span>
          </div>
          <div>
            <span class="text-2xl font-semibold">99%</span>
            <span class="mt-1 block text-xs text-muted-foreground">Audit-ready trails</span>
          </div>
          <div>
            <span class="text-2xl font-semibold">24/7</span>
            <span class="mt-1 block text-xs text-muted-foreground">Certificate access</span>
          </div>
        </div>
      </div>
      <div class="relative">
        <img
          class="aspect-4/3 w-full rounded-[28px] object-cover shadow-[0_20px_50px_rgba(15,23,42,0.25)]"
          src={aviation1}
          alt="Aircraft maintenance crew"
        />
        <div
          class="mt-4 rounded-2xl border border-border bg-card p-4 shadow-lg lg:absolute lg:right-10 lg:-bottom-10 lg:mt-0"
        >
          <p class="text-sm font-semibold">Training Pipeline</p>
          <p class="text-xs text-muted-foreground">Capture. Review. Issue.</p>
          <div class="mt-3 flex gap-1.5">
            <span class="h-1.5 flex-1 rounded-full bg-accent"></span>
            <span class="h-1.5 flex-1 rounded-full bg-accent"></span>
            <span class="h-1.5 flex-1 rounded-full bg-accent"></span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="bg-card px-6 py-14 lg:px-16 xl:px-24">
    <div class="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <h2 class="text-3xl font-semibold tracking-tight">Built for regulated aviation teams.</h2>
        <p class="mt-4 text-base leading-relaxed text-muted-foreground">
          Aligns training records, reviewer approvals, and certificate delivery in one consistent
          workflow—ready for audits, renewals, and compliance reporting.
        </p>
      </div>
      <div class="grid gap-4">
        <article class="rounded-2xl border border-border bg-background p-5">
          <h3 class="text-base font-semibold">Role-aware workflows</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            Users see their training, reviewers see approvals, admins see everything.
          </p>
        </article>
        <article class="rounded-2xl border border-border bg-background p-5">
          <h3 class="text-base font-semibold">Automated issuance</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            Generate, store, and share certificates with click-to-view PDF access.
          </p>
        </article>
        <article class="rounded-2xl border border-border bg-background p-5">
          <h3 class="text-base font-semibold">Reliable traceability</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            Every action is logged so auditors can verify without manual digging.
          </p>
        </article>
      </div>
    </div>
  </section>

  <section class="px-6 py-14 lg:px-16 xl:px-24">
    <div class="mx-auto max-w-6xl">
      <div class="max-w-2xl">
        <h2 class="text-3xl font-semibold tracking-tight">
          From training to certification in one timeline.
        </h2>
        <p class="mt-4 text-base leading-relaxed text-muted-foreground">
          Keep location, training dates, and reviewer notes attached to every record. Approvals flow
          to issuance with no duplicate entries.
        </p>
      </div>
      <div class="mt-8 grid gap-6 lg:grid-cols-2">
        <figure class="overflow-hidden rounded-2xl border border-border bg-card">
          <img class="h-56 w-full object-cover" src={aviation2} alt="Aviation classroom" />
          <figcaption class="p-4 text-sm text-muted-foreground">
            Training sessions captured in real time.
          </figcaption>
        </figure>
        <figure class="overflow-hidden rounded-2xl border border-border bg-card">
          <img class="h-56 w-full object-cover" src={aviation3} alt="Cockpit instrumentation" />
          <figcaption class="p-4 text-sm text-muted-foreground">
            Approval-ready records for every module.
          </figcaption>
        </figure>
      </div>
    </div>
  </section>

  <section class="border-t border-border px-6 py-12 lg:px-16 xl:px-24">
    <div
      class="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 lg:flex-row lg:items-center"
    >
      <div>
        <h2 class="text-3xl font-semibold tracking-tight">Ready to streamline certification?</h2>
        <p class="mt-2 text-base text-muted-foreground">
          Launch a pilot program with your next training cohort.
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <a
          class="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg"
          href={resolve("/signup")}
        >
          Start a Pilot
        </a>
        <a
          class="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground"
          href={resolve("/login")}
        >
          Sign In
        </a>
      </div>
    </div>
  </section>

  <footer class="border-t border-border bg-card px-6 py-8 lg:px-16 xl:px-24">
    <div
      class="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 text-sm text-muted-foreground md:flex-row md:justify-between"
    >
      <span class="flex items-center font-medium text-foreground">
        <img src={favicon} alt="PETRONAS logo" class="mr-1 inline-block size-5" /> PETRONAS Aviation
      </span>
      <span>© {currentYear} PETRONAS Aviation. All rights reserved.</span>
    </div>
  </footer>
</main>
