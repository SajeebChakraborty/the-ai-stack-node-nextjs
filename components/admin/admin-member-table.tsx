"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import type { Role } from "@/types/domain";
import type { AdminMember } from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const roleOptions: Role[] = ["user", "creator", "founder", "moderator", "admin"];

type EditForm = {
  fullName: string;
  role: Role;
  trustScore: string;
  isVerified: boolean;
  suspended: boolean;
  companyName: string;
  title: string;
};

function toEditForm(member: AdminMember): EditForm {
  return {
    fullName: member.name,
    role: member.role,
    trustScore: String(member.trustScore),
    isVerified: member.isVerified,
    suspended: member.suspended,
    companyName: member.companyName ?? "",
    title: member.title ?? ""
  };
}

function renderStatusBadges(member: AdminMember, verificationMode: "none" | "founder-payment") {
  if (verificationMode === "founder-payment") {
    const verified = Boolean(member.founderPaymentVerified);
    return (
      <div className="flex flex-wrap gap-1">
        <Badge variant={verified ? "verified" : "secondary"}>{verified ? "Verified" : "Not verified"}</Badge>
        {member.suspended ? <Badge variant="outline">Suspended</Badge> : null}
      </div>
    );
  }

  return member.suspended ? <Badge variant="outline">Suspended</Badge> : <span className="text-muted-foreground">—</span>;
}

export function AdminMemberTable({
  title,
  description,
  members,
  showFounderFields = false,
  verificationMode = "none",
  allowedRoles = roleOptions
}: {
  title: string;
  description: string;
  members: AdminMember[];
  showFounderFields?: boolean;
  verificationMode?: "none" | "founder-payment";
  allowedRoles?: Role[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(members);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRows(members);
  }, [members]);

  function startEdit(member: AdminMember) {
    setEditingId(member.id);
    setEditForm(toEditForm(member));
    setStatusMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveMember(memberId: string) {
    if (!editForm) {
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editForm.fullName,
          role: editForm.role,
          trustScore: Number(editForm.trustScore),
          ...(verificationMode === "founder-payment" ? {} : { isVerified: editForm.isVerified }),
          suspended: editForm.suspended,
          companyName: showFounderFields ? editForm.companyName : undefined,
          title: showFounderFields ? editForm.title : undefined
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatusMessage(payload.error ?? "Update failed.");
        return;
      }

      setRows((current) =>
        current.map((member) =>
          member.id === memberId
            ? {
                ...member,
                name: editForm.fullName,
                role: editForm.role,
                trustScore: Number(editForm.trustScore),
                isVerified: editForm.isVerified,
                suspended: editForm.suspended,
                companyName: editForm.companyName || null,
                title: editForm.title || null
              }
            : member
        )
      );
      cancelEdit();
      router.refresh();
    } catch {
      setStatusMessage("Update failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteMember(member: AdminMember) {
    const confirmed = window.confirm(`Delete ${member.name} (${member.email})? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setStatusMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${member.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatusMessage(payload.error ?? "Delete failed.");
        return;
      }

      setRows((current) => current.filter((row) => row.id !== member.id));
      if (editingId === member.id) {
        cancelEdit();
      }
      router.refresh();
    } catch {
      setStatusMessage("Delete failed. Please try again.");
    }
  }

  const columnCount = showFounderFields ? 8 : 7;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusMessage ? <p className="text-sm text-destructive">{statusMessage}</p> : null}
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Member</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  {showFounderFields ? <th className="py-2 pr-4 font-medium">Company</th> : null}
                  <th className="py-2 pr-4 font-medium">Connected</th>
                  <th className="py-2 pr-4 font-medium">Listings</th>
                  <th className="py-2 pr-4 font-medium">Trust</th>
                  <th className="py-2 pr-4 font-medium">{verificationMode === "founder-payment" ? "Founder status" : "Status"}</th>
                  <th className="py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((member) => (
                  <Fragment key={member.id}>
                    <tr className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-foreground">{member.name}</div>
                        <div className="text-muted-foreground">{member.email}</div>
                        <div className="text-xs text-muted-foreground">Joined {member.createdAt}</div>
                      </td>
                      <td className="py-3 pr-4 capitalize">{member.role}</td>
                      {showFounderFields ? (
                        <td className="py-3 pr-4">
                          <div>{member.companyName ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{member.title ?? "—"}</div>
                        </td>
                      ) : null}
                      <td className="py-3 pr-4">{member.connectedAccounts}</td>
                      <td className="py-3 pr-4">{member.listingsCount}</td>
                      <td className="py-3 pr-4">{member.trustScore}</td>
                      <td className="py-3 pr-4">{renderStatusBadges(member, verificationMode)}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEdit(member)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteMember(member)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {editingId === member.id && editForm ? (
                      <tr>
                        <td colSpan={columnCount} className="pb-4">
                          <div className="grid gap-3 rounded-md border bg-secondary/30 p-4 md:grid-cols-2">
                            <label className="space-y-1 text-sm">
                              <span className="font-medium">Full name</span>
                              <Input value={editForm.fullName} onChange={(event) => setEditForm({ ...editForm, fullName: event.target.value })} />
                            </label>
                            <label className="space-y-1 text-sm">
                              <span className="font-medium">Role</span>
                              <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value as Role })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {allowedRoles.map((role) => (
                                    <SelectItem key={role} value={role}>
                                      {role}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </label>
                            <label className="space-y-1 text-sm">
                              <span className="font-medium">Trust score</span>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={editForm.trustScore}
                                onChange={(event) => setEditForm({ ...editForm, trustScore: event.target.value })}
                              />
                            </label>
                            {showFounderFields ? (
                              <>
                                <label className="space-y-1 text-sm">
                                  <span className="font-medium">Company</span>
                                  <Input value={editForm.companyName} onChange={(event) => setEditForm({ ...editForm, companyName: event.target.value })} />
                                </label>
                                <label className="space-y-1 text-sm">
                                  <span className="font-medium">Title</span>
                                  <Input value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} />
                                </label>
                              </>
                            ) : null}
                            {verificationMode === "founder-payment" ? (
                              <div className="rounded-md border p-3 text-sm text-muted-foreground md:col-span-2">
                                Founder verification is set automatically when a paid subscription is completed. It cannot be edited manually.
                              </div>
                            ) : (
                              <label className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
                                <span className="font-medium">Verified account</span>
                                <Switch checked={editForm.isVerified} onCheckedChange={(checked) => setEditForm({ ...editForm, isVerified: checked })} />
                              </label>
                            )}
                            <label className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
                              <span className="font-medium">Suspended</span>
                              <Switch checked={editForm.suspended} onCheckedChange={(checked) => setEditForm({ ...editForm, suspended: checked })} />
                            </label>
                            <div className="flex gap-2 md:col-span-2">
                              <Button disabled={isSaving} onClick={() => saveMember(member.id)}>
                                {isSaving ? "Saving..." : "Save changes"}
                              </Button>
                              <Button variant="outline" onClick={cancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">No accounts in this list yet.</div>
        )}
      </CardContent>
    </Card>
  );
}
