"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { ListingClaimRequestView } from "@/types/listing-claim-request";
import { showErrorAlert, showSuccessAlert } from "@/lib/ui/sweet-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import "sweetalert2/dist/sweetalert2.min.css";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export function AdminClaimRequestsPanel({
  initialRequests = []
}: {
  initialRequests?: ListingClaimRequestView[];
}) {
  const router = useRouter();
  const [requests, setRequests] = useState<ListingClaimRequestView[]>(initialRequests ?? []);

  useEffect(() => {
    setRequests(initialRequests ?? []);
  }, [initialRequests]);
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reviewRequest(requestId: string, action: "approve" | "reject") {
    setBusyId(requestId);

    try {
      const response = await fetch(`/api/admin/listing-claim-requests/${requestId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notesById[requestId] ?? "" })
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        void showErrorAlert({
          title: action === "approve" ? "Approval failed" : "Rejection failed",
          text: payload.error ?? "Could not update this request."
        });
        return;
      }

      setRequests((current) =>
        (current ?? []).map((item) =>
          item.id === requestId
            ? {
                ...item,
                status: action === "approve" ? "approved" : "rejected",
                adminNotes: notesById[requestId] ?? null,
                reviewedAt: new Date().toISOString(),
                tool:
                  action === "approve"
                    ? { ...item.tool, founderId: item.requester.id }
                    : item.tool
              }
            : item
        )
      );

      void showSuccessAlert({
        title: action === "approve" ? "Claim approved" : "Claim rejected",
        text: payload.message ?? "Request updated."
      });
      router.refresh();
    } catch {
      void showErrorAlert({ title: "Update failed", text: "Something went wrong. Please try again." });
    } finally {
      setBusyId(null);
    }
  }

  const pending = requests.filter((item) => item.status === "pending");
  const reviewed = requests.filter((item) => item.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Listing claim requests</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review business documents from users who want to claim unassigned directory listings. Approving assigns the
          listing to the requester.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {pending.length ? (
            pending.map((request) => (
              <div key={request.id} className="rounded-xl border border-border/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{request.tool.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Requested by {request.requester.name} ({request.requester.email})
                    </p>
                    <p className="text-xs text-muted-foreground">Submitted {formatDate(request.createdAt)}</p>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
                <div className="mt-4 grid gap-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Business:</span> {request.businessName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Start / registration:</span>{" "}
                    {formatDate(request.businessStartDate)} · {formatDate(request.businessRegistrationDate)}
                  </p>
                  <p>
                    <a className="text-primary hover:underline" href={request.businessDocumentUrl} target="_blank" rel="noreferrer">
                      Business document
                      <ExternalLink className="ml-1 inline h-3 w-3" />
                    </a>
                  </p>
                  {request.attachmentUrls.length ? (
                    <ul className="list-disc pl-5">
                      {request.attachmentUrls.map((url) => (
                        <li key={url}>
                          <a className="text-primary hover:underline" href={url} target="_blank" rel="noreferrer">
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {request.additionalNotes ? <p>{request.additionalNotes}</p> : null}
                </div>
                <Textarea
                  className="mt-3"
                  placeholder="Admin notes (optional)"
                  rows={2}
                  value={notesById[request.id] ?? ""}
                  onChange={(event) =>
                    setNotesById((current) => ({ ...current, [request.id]: event.target.value }))
                  }
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={busyId === request.id}
                    onClick={() => void reviewRequest(request.id, "approve")}
                  >
                    Approve & assign
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === request.id}
                    onClick={() => void reviewRequest(request.id, "reject")}
                  >
                    Reject
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/tools/${request.tool.slug}`}>View listing</Link>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No pending claim requests.</p>
          )}
        </CardContent>
      </Card>

      {reviewed.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Reviewed ({reviewed.length})</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {reviewed.map((request) => (
              <div key={request.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {request.tool.name} · {request.requester.name}
                  </p>
                  <Badge variant={request.status === "approved" ? "verified" : "destructive"} className="capitalize">
                    {request.status}
                  </Badge>
                </div>
                {request.adminNotes ? (
                  <p className="mt-1 text-muted-foreground">{request.adminNotes}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
