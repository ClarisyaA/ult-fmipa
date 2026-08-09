"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PendingSurveyRequest } from "@/lib/service-surveys";

/**
 * Client-side half of the survey gate (Issue 9). Server-side enforcement
 * lives in the request-creation API route — this component only blocks
 * navigation/UI so a student isn't stuck without knowing why. It relies on
 * `/api/student/surveys/pending`, which already scopes itself to the
 * MAHASISWA role and returns `{ data: null }` for anyone else (including
 * unauthenticated visitors), so this component is safe to mount globally
 * for every role without doing its own role check.
 */
export function SurveyGate() {
  const pathname = usePathname();
  const [pending, setPending] = useState<PendingSurveyRequest | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkPendingSurvey() {
      try {
        const response = await fetch("/api/student/surveys/pending", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (isMounted) {
            setPending(null);
          }
          return;
        }

        const body = (await response.json()) as { data?: PendingSurveyRequest | null };

        if (isMounted) {
          setPending(body.data ?? null);
        }
      } catch {
        // Network hiccup: don't block the app on a failed check.
        if (isMounted) {
          setPending(null);
        }
      } finally {
        if (isMounted) {
          setChecked(true);
        }
      }
    }

    checkPendingSurvey();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Let the student actually reach the survey page (and use it) instead of
  // stacking the blocking dialog on top of the form they need to fill.
  const onSurveyPage = pathname === "/survei";
  const open = checked && Boolean(pending) && !onSurveyPage;

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Survei layanan menunggu diisi</DialogTitle>
          <DialogDescription>Isi survei sekarang untuk melanjutkan.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Keluar
          </Button>
          <Button asChild>
            <Link href="/survei">Isi Survei Sekarang</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
