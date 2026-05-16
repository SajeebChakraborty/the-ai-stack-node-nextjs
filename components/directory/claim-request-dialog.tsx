"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import type { Tool } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  validateListingClaimRequestForm,
  type ListingClaimRequestFormValues
} from "@/lib/validation/listing-claim-request-form";
import { showErrorAlert, showErrorListAlert, showSuccessAlert } from "@/lib/ui/sweet-alert";
import "sweetalert2/dist/sweetalert2.min.css";

const emptyForm: ListingClaimRequestFormValues = {
  businessName: "",
  businessStartDate: "",
  businessRegistrationDate: "",
  businessDocumentUrl: "",
  additionalNotes: "",
  attachmentUrls: ""
};

export function ClaimRequestDialog({
  tool,
  open,
  onClose,
  onSubmitted
}: {
  tool: Tool;
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const [form, setForm] = useState<ListingClaimRequestFormValues>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, isSubmitting]);

  function updateField<K extends keyof ListingClaimRequestFormValues>(key: K, value: ListingClaimRequestFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleBackdropMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose();
    }
  }

  async function submitRequest() {
    const errors = validateListingClaimRequestForm(form);
    if (errors.length) {
      void showErrorListAlert({ title: "Fix these fields", messages: errors });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/listing-claim-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: tool.id,
          ...form
        })
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        void showErrorAlert({
          title: "Could not submit request",
          text: payload.error ?? "Try again in a moment."
        });
        return;
      }

      void showSuccessAlert({
        title: "Claim request submitted",
        text: payload.message ?? "An admin will review your documents."
      });
      setForm(emptyForm);
      onSubmitted?.();
      onClose();
    } catch {
      void showErrorAlert({ title: "Could not submit request", text: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-request-title"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-background p-6 shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="claim-request-title" className="text-xl font-semibold">
          Request to claim {tool.name}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Submit your business details and document links. An admin will review and assign this listing to your account
          if approved.
        </p>

        <div className="mt-5 space-y-4">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Business name</span>
            <Input value={form.businessName} onChange={(e) => updateField("businessName", e.target.value)} required />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Business start date</span>
              <Input
                type="date"
                value={form.businessStartDate}
                onChange={(e) => updateField("businessStartDate", e.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Business registration date</span>
              <Input
                type="date"
                value={form.businessRegistrationDate}
                onChange={(e) => updateField("businessRegistrationDate", e.target.value)}
                required
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Business document URL</span>
            <Input
              type="url"
              placeholder="Link to registration certificate or business proof"
              value={form.businessDocumentUrl}
              onChange={(e) => updateField("businessDocumentUrl", e.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Additional attachments (optional)</span>
            <Textarea
              placeholder="One URL per line — licenses, tax IDs, pitch decks, etc."
              rows={3}
              value={form.attachmentUrls}
              onChange={(e) => updateField("attachmentUrls", e.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Notes for reviewer (optional)</span>
            <Textarea
              placeholder="Anything else the admin should know"
              rows={2}
              value={form.additionalNotes}
              onChange={(e) => updateField("additionalNotes", e.target.value)}
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={() => void submitRequest()}>
            {isSubmitting ? "Submitting..." : "Submit claim request"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
