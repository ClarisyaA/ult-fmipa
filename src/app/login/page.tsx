import { Suspense } from "react";

import { LoginForm } from "@/app/login/login-form";

function getPausMode() {
  return process.env.PAUS_MODE === "legacy" ? "legacy" : "modern";
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Suspense fallback={null}>
        <LoginForm
          pausMode={getPausMode()}
          pausLegacyLoginUrl={process.env.PAUS_LEGACY_LOGIN_URL}
        />
      </Suspense>
    </main>
  );
}
