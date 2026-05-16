"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import type { ListingClaimRequestView } from "@/types/listing-claim-request";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

function statusVariant(status: string) {
  switch (status) {
    case "approved":
      return "verified" as const;
    case "rejected":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export function ClaimRequestsPanel({
  initialRequests = []
}: {
  initialRequests?: ListingClaimRequestView[];
}) {
  const [requests, setRequests] = useState<ListingClaimRequestView[]>(initialRequests ?? []);

  useEffect(() => {
    setRequests(initialRequests ?? []);
  }, [initialRequests]);

  useEffect(() => {
    void fetch("/api/listing-claim-requests/mine")
      .then((response) => response.json())
      .then((payload: { requests?: ListingClaimRequestView[] }) => {
        if (payload.requests) {
          setRequests(payload.requests);
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="space-y-8">
      <div className="border-b border-border/60 pb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Claim requests</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Your listing claims</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
          Track requests you submitted from the directory for unclaimed listings.
        </p>
      </div>

      {requests.length ? (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="border-border/80 bg-card/50 shadow-none">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{request.tool.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{request.tool.tagline}</p>
                  </div>
                  <Badge variant={statusVariant(request.status)} className="capitalize">
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Business:</span> {request.businessName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Submitted:</span> {formatDate(request.createdAt)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Start date:</span>{" "}
                    {formatDate(request.businessStartDate)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Registration date:</span>{" "}
                    {formatDate(request.businessRegistrationDate)}
                  </p>
                </div>
                <p>
                  <span className="text-muted-foreground">Business document:</span>{" "}
                  <a className="text-primary hover:underline" href={request.businessDocumentUrl} target="_blank" rel="noreferrer">
                    View document
                    <ExternalLink className="ml-1 inline h-3 w-3" />
                  </a>
                </p>
                {request.attachmentUrls.length ? (
                  <div>
                    <p className="text-muted-foreground">Attachments</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {request.attachmentUrls.map((url) => (
                        <li key={url}>
                          <a className="text-primary hover:underline" href={url} target="_blank" rel="noreferrer">
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {request.additionalNotes ? (
                  <p>
                    <span className="text-muted-foreground">Your notes:</span> {request.additionalNotes}
                  </p>
                ) : null}
                {request.adminNotes ? (
                  <p className={cn(request.status === "rejected" && "text-destructive")}>
                    <span className="font-medium">Admin response:</span> {request.adminNotes}
                  </p>
                ) : null}
                <Button asChild size="sm" variant="outline" className="w-fit">
                  <Link href={`/tools/${request.tool.slug}`}>View listing</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border/80 bg-card/30 shadow-none">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No claim requests yet. Browse the directory and use Claim request on unclaimed listings.
            </p>
            <Button asChild size="sm">
              <Link href="/directory">Browse directory</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
