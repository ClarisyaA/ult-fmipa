"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type ConfirmToastOptions = {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
};

export function confirmToast({
  title = "Konfirmasi tindakan",
  description,
  confirmLabel = "Lanjut",
  cancelLabel = "Batal",
  variant = "default",
}: ConfirmToastOptions) {
  return new Promise<boolean>((resolve) => {
    let resolved = false;

    const finish = (value: boolean, toastId: string | number) => {
      if (resolved) {
        return;
      }

      resolved = true;
      toast.dismiss(toastId);
      resolve(value);
    };

    const toastId = toast.custom(
      (id) => (
        <div className="grid max-w-sm gap-3 rounded-lg border border-[#e5d9c8] bg-white p-4 text-[#1f261f] shadow-lg">
          <div className="grid gap-1">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-sm leading-relaxed text-[#5f625f]">
              {description}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => finish(false, id)}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={variant === "destructive" ? "destructive" : "default"}
              size="sm"
              onClick={() => finish(true, id)}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        onDismiss: () => {
          if (!resolved) {
            resolved = true;
            resolve(false);
          }
        },
      },
    );

    window.setTimeout(() => {
      if (!resolved) {
        toast.dismiss(toastId);
      }
    }, 30000);
  });
}
