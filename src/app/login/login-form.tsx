"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { getProviders, getSession, signIn } from "next-auth/react";
import type { ClientSafeProvider } from "next-auth/react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
  const [accessMode, setAccessMode] = useState<
    "select" | "sivitas"
  >("select");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  function handlePausLogin() {
    if (pausMode === "legacy") {
      handleLegacyPausLogin();
      return;
    }

    signIn("paus", {
      callbackUrl: getPostPausLoginCallback(),
    });
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

  if (accessMode === "select") {
    const isPausAvailable =
      (pausMode === "modern" && Boolean(providers?.paus)) ||
      (pausMode === "legacy" && Boolean(pausLegacyLoginUrl));

    return (
      <div className="animate-login-content-in w-full max-w-sm sm:max-w-[38rem]">
        <div className="mb-7 text-center">
          <h2 className="text-3xl font-extrabold tracking-normal text-slate-950 sm:text-[2rem]">
            Pilih Akses Layanan
          </h2>
          <p className="mt-3 text-sm font-medium text-[#4f3b36]">
            Silakan pilih kategori pengguna untuk melanjutkan.
          </p>
        </div>

        <div className="grid gap-4">
          <article className="group relative overflow-hidden rounded-2xl border border-[#ead8c7] bg-white p-4 shadow-[0_18px_55px_rgba(20,24,36,0.08)] transition-all hover:-translate-y-1 hover:border-[#d6001c]/55 hover:shadow-[0_24px_70px_rgba(214,0,28,0.16)]">
            <div className="grid gap-4 sm:grid-cols-[1fr_0.9fr] sm:items-center">
              <div className="order-2 px-1 text-center sm:order-1 sm:text-left">
                <h3 className="text-xl font-extrabold text-slate-950">
                  Pengguna Layanan
                </h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#4f3b36]">
                  Untuk mahasiswa dan alumni FMIPA Unpad yang ingin mengakses
                  layanan akademik terpadu.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isPausAvailable}
                  className="mt-5 h-11 w-full rounded-full border-[#d6001c] bg-white text-sm font-extrabold text-[#d6001c] shadow-sm transition-all hover:bg-[#d6001c] hover:text-white hover:shadow-lg hover:shadow-[#d6001c]/20 disabled:opacity-60"
                  onClick={handlePausLogin}
                >
                  Masuk sebagai Pengguna
                </Button>
              </div>
              <div className="order-1 flex items-center justify-center sm:order-2">
                <Image
                  src="/mahasiswa.svg"
                  alt="Ilustrasi pengguna layanan"
                  width={360}
                  height={245}
                  className="h-44 w-full object-contain transition-transform duration-300 group-hover:scale-[1.03] sm:h-40"
                />
              </div>
            </div>
          </article>

          <article className="group relative overflow-hidden rounded-2xl border border-[#ead8c7] bg-white p-4 shadow-[0_18px_55px_rgba(20,24,36,0.08)] transition-all hover:-translate-y-1 hover:border-[#d6001c]/55 hover:shadow-[0_24px_70px_rgba(214,0,28,0.16)]">
            <div className="grid gap-4 sm:grid-cols-[1fr_0.9fr] sm:items-center">
              <div className="order-2 px-1 text-center sm:order-1 sm:text-left">
                <h3 className="text-xl font-extrabold text-slate-950">
                  Sivitas Akademika
                </h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#4f3b36]">
                  Untuk dosen dan tenaga kependidikan FMIPA Unpad dengan akun
                  internal layanan.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 h-11 w-full rounded-full border-[#d6001c] bg-white text-sm font-extrabold text-[#d6001c] shadow-sm transition-all hover:bg-[#d6001c] hover:text-white hover:shadow-lg hover:shadow-[#d6001c]/20"
                  onClick={() => setAccessMode("sivitas")}
                >
                  Masuk sebagai Sivitas
                </Button>
              </div>
              <div className="order-1 flex items-center justify-center sm:order-2">
                <Image
                  src="/sivitas.svg"
                  alt="Ilustrasi sivitas akademika"
                  width={360}
                  height={245}
                  className="h-44 w-full object-contain transition-transform duration-300 group-hover:scale-[1.03] sm:h-40"
                />
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-login-content-in w-full max-w-sm sm:max-w-md">
      <div className="mb-10">
        <button
          type="button"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#d6001c] transition-colors hover:text-[#a80016]"
          onClick={() => setAccessMode("select")}
        >
          <ArrowLeft className="size-4" />
          Pilih akses lain
        </button>
        <h2 className="text-3xl font-extrabold tracking-normal text-slate-950">
          Selamat Datang Kembali
        </h2>
        <p className="mt-3 text-base text-[#6f4f4a]">
          Masuk dengan akun Anda untuk melanjutkan.
        </p>
      </div>

      <form className="grid gap-5" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label
            htmlFor="email"
            className="text-sm font-bold tracking-[0.04em] text-[#70443e]"
          >
            Username
          </Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#d6001c]" />
            <Input
              id="email"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-14 rounded-xl border-[#ead8c7] bg-[#f8f8ff] pl-14 pr-4 text-base text-slate-900 shadow-sm focus-visible:border-[#d6001c] focus-visible:ring-[#d6001c]/15"
              data-testid="login-email"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-4">
            <Label
              htmlFor="password"
              className="text-sm font-bold tracking-[0.04em] text-[#70443e]"
            >
              Password
            </Label>
            <button
              type="button"
              className="text-sm font-bold text-[#d6001c] transition-colors hover:text-[#a80016]"
            >
              Lupa Kata Sandi?
            </button>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#d6001c]" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-14 rounded-xl border-[#ead8c7] bg-[#f8f8ff] pl-14 pr-14 text-base text-slate-900 shadow-sm focus-visible:border-[#d6001c] focus-visible:ring-[#d6001c]/15"
              data-testid="login-password"
            />
            <button
              type="button"
              aria-label={
                showPassword ? "Sembunyikan password" : "Tampilkan password"
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6f4f4a] transition-colors hover:text-[#d6001c]"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm font-semibold text-[#70443e]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="size-4 rounded border-[#efb9b3] text-[#d6001c] accent-[#d6001c]"
          />
          Ingat saya di perangkat ini
        </label>

        {error ? (
          <p className="rounded-xl border border-[#d6001c]/25 bg-[#d6001c]/8 px-4 py-3 text-sm font-medium text-[#b00017]">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 h-16 rounded-xl bg-[#df001d] text-xl font-extrabold text-white shadow-xl shadow-[#df001d]/20 transition-all hover:-translate-y-0.5 hover:bg-[#c9001a] disabled:hover:translate-y-0"
          data-testid="login-submit"
        >
          {isSubmitting ? "Memproses..." : "Masuk Sekarang"}
        </Button>
      </form>

    </div>
  );
}
