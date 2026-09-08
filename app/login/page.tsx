import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/audit/auth";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign in — Usage log",
  // No point letting a crawler index a login form for an internal tool.
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await readSession()) redirect("/dashboard");

  return (
    <div className="min-h-screen w-full bg-white text-neutral-900">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6">
        <div>
          <h1 className="text-xl font-semibold">Usage log</h1>
          <p className="text-sm text-neutral-600">
            Sign in to see how the proposal and SLA builders are being used.
          </p>
        </div>

        <LoginForm />
      </main>
    </div>
  );
}
