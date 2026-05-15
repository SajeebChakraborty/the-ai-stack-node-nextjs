"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function UpgradePlanDialog({
  open,
  onClose,
  title,
  description
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button asChild>
            <Link href="/pricing">Upgrade plan</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
