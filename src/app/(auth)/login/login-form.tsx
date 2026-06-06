"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInWithPassword, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-900"
    >
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

const inputClass =
  "h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/10 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:border-zinc-100";

export function LoginForm() {
  const [state, formAction] = useActionState(signInWithPassword, initialState);
  const hasError = state.status === "error";

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="identifier" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Usuário ou e-mail
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          required
          autoFocus
          autoComplete="username"
          placeholder="procuravaga"
          aria-invalid={hasError}
          aria-describedby={hasError ? "login-error" : undefined}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={hasError}
          aria-describedby={hasError ? "login-error" : undefined}
          className={inputClass}
        />
      </div>

      <SubmitButton />

      {hasError && (
        <p id="login-error" role="alert" aria-live="assertive" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
    </form>
  );
}
