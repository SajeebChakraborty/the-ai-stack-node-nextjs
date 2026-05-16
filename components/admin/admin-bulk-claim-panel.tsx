"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { BULK_CLAIM_HEADERS } from "@/lib/admin/bulk-claim-columns";
import { showErrorAlert, showErrorListAlert, showSuccessAlert } from "@/lib/ui/sweet-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import "sweetalert2/dist/sweetalert2.min.css";

type BulkClaimJobView = {
  id: string;
  status: string;
  fileName: string | null;
  totalRows: number;
  processedRows: number;
  createdCount: number;
  failedCount: number;
  progressPercent: number;
  created: Array<{ row: number; slug: string; name: string }>;
  failed: Array<{ row: number; error: string }>;
  errorMessage: string | null;
};

type JobResponse = {
  job: BulkClaimJobView | null;
  error?: string;
  message?: string;
};

const POLL_MS = 1500;

function statusLabel(status: string) {
  switch (status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

export function AdminBulkClaimPanel() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const completedJobRef = useRef<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeJob, setActiveJob] = useState<BulkClaimJobView | null>(null);

  const applyJob = useCallback((job: BulkClaimJobView | null) => {
    setActiveJob(job);

    if (!job) {
      return;
    }

    if (job.status !== "completed" && job.status !== "failed") {
      completedJobRef.current = null;
      return;
    }

    if (completedJobRef.current === job.id) {
      return;
    }

    completedJobRef.current = job.id;
    router.refresh();

    if (job.status === "failed") {
      void showErrorAlert({
        title: "Bulk import failed",
        text: job.errorMessage ?? "The background import stopped unexpectedly."
      });
      return;
    }

    if (job.failed.length > 0) {
      void showErrorListAlert({
        title: "Import completed with errors",
        messages: [
          `${job.createdCount} created, ${job.failedCount} failed.`,
          ...job.failed.slice(0, 8).map((item) => `Row ${item.row}: ${item.error}`),
          ...(job.failed.length > 8 ? [`…and ${job.failed.length - 8} more`] : [])
        ]
      });
      return;
    }

    void showSuccessAlert({
      title: "Bulk import complete",
      text: `${job.createdCount} claim(s) created and approved.`
    });
  }, [router]);

  const fetchJob = useCallback(async (jobId?: string) => {
    const url = jobId ? `/api/admin/bulk-claims/jobs/${jobId}` : "/api/admin/bulk-claims";
    const response = await fetch(url, { cache: "no-store" });
    const payload = (await response.json()) as JobResponse;

    if (!response.ok) {
      return null;
    }

    applyJob(payload.job);
    return payload.job;
  }, [applyJob]);

  useEffect(() => {
    void fetchJob();
  }, [fetchJob]);

  useEffect(() => {
    if (!activeJob || (activeJob.status !== "queued" && activeJob.status !== "processing")) {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchJob(activeJob.id);
    }, POLL_MS);

    return () => window.clearInterval(interval);
  }, [activeJob, fetchJob]);

  async function downloadSample() {
    try {
      const response = await fetch("/api/admin/bulk-claims/sample");
      if (!response.ok) {
        void showErrorAlert({ title: "Download failed", text: "Could not download the sample spreadsheet." });
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "bulk-claims-sample.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      void showErrorAlert({ title: "Download failed", text: "Something went wrong. Please try again." });
    }
  }

  async function uploadSpreadsheet(file: File) {
    setIsUploading(true);
    completedJobRef.current = null;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/bulk-claims", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as JobResponse & { job?: BulkClaimJobView };

      if (!response.ok) {
        void showErrorAlert({
          title: "Import failed",
          text: payload.error ?? "Could not queue the bulk import."
        });
        return;
      }

      if (payload.job) {
        applyJob(payload.job);
      }
    } catch {
      void showErrorAlert({ title: "Import failed", text: "Something went wrong. Please try again." });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const isRunning = activeJob?.status === "queued" || activeJob?.status === "processing";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Bulk claim import
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload an Excel sheet to queue many claimed listings. Imports run in a background queue and auto-approve
            each row. Optionally set <code className="text-xs">user_id</code> or{" "}
            <code className="text-xs">founder_id</code> per row.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={downloadSample}>
              <Download className="mr-2 h-4 w-4" />
              Download sample Excel (10 claims)
            </Button>
            <Button type="button" disabled={isUploading || isRunning} onClick={() => fileInputRef.current?.click()}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {isRunning ? "Import in progress..." : "Upload Excel file"}
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void uploadSpreadsheet(file);
                }
              }}
            />
          </div>

          <div className="rounded-lg border border-border/80 bg-muted/30 p-4">
            <p className="mb-2 text-sm font-medium">Spreadsheet columns</p>
            <p className="text-xs text-muted-foreground">{BULK_CLAIM_HEADERS.join(", ")}</p>
          </div>
        </CardContent>
      </Card>

      {activeJob ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Import progress
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  activeJob.status === "completed" && "bg-emerald-500/15 text-emerald-600",
                  activeJob.status === "failed" && "bg-destructive/15 text-destructive",
                  (activeJob.status === "queued" || activeJob.status === "processing") &&
                    "bg-primary/15 text-primary"
                )}
              >
                {statusLabel(activeJob.status)}
              </span>
            </CardTitle>
            {activeJob.fileName ? (
              <p className="text-sm text-muted-foreground">{activeJob.fileName}</p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {activeJob.processedRows} / {activeJob.totalRows} claims processed
                </span>
                <span className="font-medium">{activeJob.progressPercent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    activeJob.status === "failed" ? "bg-destructive" : "bg-primary"
                  )}
                  style={{ width: `${activeJob.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/80 p-3">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-2xl font-semibold text-emerald-600">{activeJob.createdCount}</p>
              </div>
              <div className="rounded-lg border border-border/80 p-3">
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-2xl font-semibold text-destructive">{activeJob.failedCount}</p>
              </div>
              <div className="rounded-lg border border-border/80 p-3">
                <p className="text-xs text-muted-foreground">Total rows</p>
                <p className="text-2xl font-semibold">{activeJob.totalRows}</p>
              </div>
            </div>

            {isRunning ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Background queue is processing claims. You can stay on this page to watch progress.
              </p>
            ) : null}

            {activeJob.errorMessage ? (
              <p className="text-sm text-destructive">{activeJob.errorMessage}</p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Created ({activeJob.created.length})
                </p>
                <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-muted-foreground">
                  {activeJob.created.length ? (
                    activeJob.created.map((item) => (
                      <li key={`${item.row}-${item.slug}`}>
                        Row {item.row}: {item.name} ({item.slug})
                      </li>
                    ))
                  ) : (
                    <li>None yet</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-destructive">Failed ({activeJob.failed.length})</p>
                <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-muted-foreground">
                  {activeJob.failed.length ? (
                    activeJob.failed.map((item) => (
                      <li key={`${item.row}-${item.error}`}>
                        Row {item.row}: {item.error}
                      </li>
                    ))
                  ) : (
                    <li>None</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
