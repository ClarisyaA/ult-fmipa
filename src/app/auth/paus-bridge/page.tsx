import { Suspense } from "react";

import { PausBridgeClient } from "@/app/auth/paus-bridge/paus-bridge-client";

export default function PausBridgePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Suspense fallback={null}>
        <PausBridgeClient />
      </Suspense>
    </main>
  );
}
