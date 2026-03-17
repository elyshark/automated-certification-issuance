<script lang="ts">
  import { cn } from "$lib/utils";
  import {
    FieldGroup,
    Field,
    FieldLabel,
    FieldDescription,
    FieldSeparator,
    FieldError,
  } from "$lib/components/ui/field";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import type { HTMLAttributes } from "svelte/elements";
  import { authClient } from "$lib/client/auth";
  import { enhance } from "$app/forms";
  import type { SubmitFunction } from "@sveltejs/kit";
  import { resolve } from "$app/paths";
  import { toast } from "svelte-sonner";
  import { Spinner } from "$lib/components/ui/spinner";
  import logo from "$lib/assets/header_logo.png";

  let {
    mode = "login",
    class: className,
    ...restProps
  }: { mode?: "login" | "signup" } & HTMLAttributes<HTMLDivElement> = $props();

  let loading = $state(false);
  type ErrorMap = Partial<Record<string, string>>;
  let errors = $state<ErrorMap>({});

  const handleSubmit: SubmitFunction = () => {
    loading = true;
    errors = {};
    return async ({ result, update }) => {
      loading = false;
      if (result.type === "failure") {
        errors = (result.data as { errors?: ErrorMap })?.errors ?? {};
        const first = Object.values(errors)[0];
        if (first) toast.error(first);
      } else if (result.type === "error") {
        toast.error("An unexpected error occurred.");
      }
      await update();
    };
  };

  // shared flow for login and sign up
  const handleGithubLogin = async (event: Event) => {
    event.preventDefault();
    loading = true;
    errors = {};

    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
    });
    if (error) {
      toast.error(error.message || "Failed to log in with GitHub.");
      loading = false;
    }
  };
</script>

<div class={cn("flex flex-col gap-6", className)} {...restProps}>
  <form method="POST" use:enhance={handleSubmit}>
    <FieldGroup>
      <div class="flex flex-col items-center gap-2 text-center">
        <a href={resolve("/")} class="flex flex-col items-center gap-2 font-medium">
          <div
            class="flex size-10 items-center justify-center rounded-md p-1 dark:bg-sidebar-foreground"
          >
            <img src={logo} alt="PETRONAS logo" />
          </div>
          <span class="sr-only">PETRONAS</span>
        </a>
        <h1 class="text-xl font-bold">Welcome to PETRONAS Aviation</h1>
        {#if mode === "login"}
          <FieldDescription>
            Don't have an account? <a href={resolve("/signup")}>Sign up</a>
          </FieldDescription>
        {:else}
          <FieldDescription>
            Already have an account? <a href={resolve("/login")}>Sign in</a>
          </FieldDescription>
        {/if}
      </div>
      <Field>
        <FieldLabel for="email">Email</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="me@petronas.com.my"
          required
          autocomplete="email"
        />
        {#if errors.email}
          <FieldError>{errors.email}</FieldError>
        {/if}
      </Field>
      <Field>
        <FieldLabel for="password">Password</FieldLabel>
        <Input id="password" name="password" type="password" placeholder="••••••••••" required />
        {#if errors.password}
          <FieldError>{errors.password}</FieldError>
        {/if}
      </Field>
      <Field>
        <Button type="submit" disabled={loading} class="w-full">
          {#if loading}
            <Spinner />
          {/if}
          {#if mode === "login"}
            {loading ? "Signing in..." : "Sign in"}
          {:else}
            {loading ? "Creating account…" : "Create Account"}
          {/if}
        </Button>
      </Field>
      <FieldSeparator>Or</FieldSeparator>
      <Field class="grid gap-4 sm:grid-cols-2">
        <Button variant="outline" type="button" onclick={handleGithubLogin}>
          {#if loading}
            <Spinner />
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <g
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              >
                <path
                  d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5c.08-1.25-.27-2.48-1-3.5c.28-1.15.28-2.35 0-3.5c0 0-1 0-3 1.5c-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5c-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"
                />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </g>
            </svg>
          {/if}
          Continue with GitHub
        </Button>
        <Button variant="outline" type="button" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
          Continue with Google
        </Button>
      </Field>
    </FieldGroup>
  </form>
  <FieldDescription class="px-6 text-center">
    By clicking continue, you agree to our <a href="#/">Terms of Service</a>
    and <a href="#/">Privacy Policy</a>.
  </FieldDescription>
</div>
