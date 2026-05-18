"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CertificateActions({ courseSlug, className }: { courseSlug: string; className?: string }) {
  const [downloading, setDownloading] = useState(false);

  async function downloadCertificate() {
    setDownloading(true);
    try {
      const response = await fetch(`/api/courses/${courseSlug}/certificate`);
      if (response.status === 401) {
        window.location.href = `/auth/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`;
        return;
      }
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Could not download certificate.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `TheAiStack-${courseSlug}-certificate.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not download certificate.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button type="button" className={className} disabled={downloading} onClick={() => void downloadCertificate()}>
      {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {downloading ? "Generating PDF..." : "Download certificate (PDF)"}
    </Button>
  );
}
