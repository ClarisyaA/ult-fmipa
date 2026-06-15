"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProviders, getSession, signIn } from "next-auth/react";
import type { ClientSafeProvider } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSafeRedirectUrl } from "@/lib/auth-redirect";

type LoginFormProps = {
  pausMode: "modern" | "legacy";
  pausLegacyLoginUrl?: string;
};

export function LoginForm({ pausMode, pausLegacyLoginUrl }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [providers, setProviders] = useState<Record<
    string,
    ClientSafeProvider
  > | null>(null);

  useEffect(() => {
    getProviders().then(setProviders);

    getSession().then((session) => {
      if (session?.user.role) {
        router.replace(
          getSafeRedirectUrl(
            searchParams.get("callbackUrl"),
            session.user.role,
            window.location.origin
          )
        );
      }
    });
  }, [router, searchParams]);

  function getPostPausLoginCallback() {
    const callbackUrl = searchParams.get("callbackUrl");

    if (!callbackUrl) {
      return "/login";
    }

    return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }

  function handleLegacyPausLogin() {
    if (pausLegacyLoginUrl) {
      window.location.href = pausLegacyLoginUrl;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result?.ok) {
      setError("Email atau password tidak sesuai.");
      setIsSubmitting(false);
      return;
    }

    const session = await getSession();

    if (session?.user.role) {
      router.replace(
        getSafeRedirectUrl(
          searchParams.get("callbackUrl"),
          session.user.role,
          window.location.origin
        )
      );
      return;
    }

    router.replace("/layanan");
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Login ULT FMIPA</CardTitle>
        <CardDescription>
          Gunakan kredensial development sementara untuk admin, staff, atau
          mahasiswa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pausMode === "modern" && providers?.paus ? (
          <div className="mb-4">
            <Button
              type="button"
              className="w-full"
              variant="outline"
              onClick={() =>
                signIn("paus", {
                  callbackUrl: getPostPausLoginCallback(),
                })
              }
            >
              Masuk dengan PAUS Unpad
            </Button>
          </div>
        ) : null}

        {pausMode === "legacy" && pausLegacyLoginUrl ? (
          <div className="mb-4 grid gap-2">
            <Button
              type="button"
              className="w-full"
              variant="outline"
              onClick={handleLegacyPausLogin}
            >
              Masuk dengan PAUS Unpad
            </Button>
            <p className="text-xs text-muted-foreground">
              Mode legacy bridge menggunakan callback PAUS lama untuk
              pengujian.
            </p>
          </div>
        ) : null}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              data-testid="login-email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              data-testid="login-password"
            />
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting} data-testid="login-submit">
            {isSubmitting ? "Memproses..." : "Masuk"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
