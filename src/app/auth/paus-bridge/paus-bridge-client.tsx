"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDefaultRedirectByRole } from "@/lib/auth-redirect";

export function PausBridgeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loginWithBridgeToken() {
      const token = searchParams.get("token");

      if (!token) {
        setError("Token bridge PAUS tidak ditemukan.");
        setIsLoading(false);
        return;
      }

      const result = await signIn("paus-bridge", {
        bridgeToken: token,
        redirect: false,
      });

      if (!result?.ok) {
        setError("Login PAUS bridge gagal. Token tidak valid atau kedaluwarsa.");
        setIsLoading(false);
        return;
      }

      const session = await getSession();

      if (session?.user.role) {
        router.replace(getDefaultRedirectByRole(session.user.role));
        return;
      }

      router.replace("/layanan");
    }

    loginWithBridgeToken();
  }, [router, searchParams]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login PAUS Bridge</CardTitle>
        <CardDescription>
          Memproses token sementara dari callback PAUS legacy.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Memverifikasi token bridge...
          </p>
        ) : null}

        {error ? (
          <>
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
            <Button type="button" onClick={() => router.replace("/login")}>
              Kembali ke Login
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
