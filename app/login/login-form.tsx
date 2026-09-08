"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null, username: "" };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex w-72 flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Username
        <input
          name="username"
          defaultValue={state.username}
          autoComplete="username"
          required
          autoFocus
          className="rounded border border-neutral-300 px-2 py-1"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded border border-neutral-300 px-2 py-1"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
