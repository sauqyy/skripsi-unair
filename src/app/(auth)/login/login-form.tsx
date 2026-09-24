"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Masuk</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {(state.error || linkError) && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error || linkError}
            </p>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Masuk..." : "Masuk"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-slate-900 underline">
            Daftar
          </Link>
        </p>

        {process.env.NODE_ENV !== "production" && (
          <p className="mt-2 text-center text-sm">
            <Link href="/dev-login" className="font-medium text-brand-600 underline">
              Quick Login (dev) →
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
