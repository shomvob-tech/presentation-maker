"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  verifyCredentials,
} from "@/lib/audit/auth";

export type LoginState = {
  error: string | null;
  /** Echoed back so a wrong password doesn't also clear the username. */
  username: string;
};

/**
 * Shaped for `useActionState`, hence the leading state argument.
 *
 * The error message says nothing about *which* field was wrong, so the form
 * can't be used to confirm the username exists.
 */
export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!verifyCredentials(username, password)) {
    return { error: "Wrong username or password.", username };
  }

  await createSession(username);
  // Outside any try/catch: redirect works by throwing.
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
