"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import {
  Users,
  Plus,
  Trash2,
  Mail,
  Crown,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Loader2,
  Globe,
  Calendar,
  Flag,
  ClipboardList,
  ArrowUpDown,
  Pencil,
  X,
} from "lucide-react";

interface TeamUser {
  id: string;
  name: string | null;
  email: string;
}

interface TeamMember {
  id: string;
  role: string;
  joinedAt: string;
  user: TeamUser;
}

interface TeamInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  owner: TeamUser;
  members: TeamMember[];
  invites: TeamInvite[];
}

interface Property {
  id: string;
  siteUrl: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string | null;
  assignedTo: TeamUser;
  assignedBy: TeamUser;
  property: { siteUrl: string };
  createdAt: string;
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700" },
  medium: { label: "Medium", className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800" },
  high: { label: "High", className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800" },
  critical: { label: "Critical", className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800" },
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700" },
  in_progress: { label: "In Progress", className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800" },
  done: { label: "Done", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" },
  blocked: { label: "Blocked", className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800" },
};

function Avatar({ user, size = "md" }: { user: TeamUser; size?: "sm" | "md" | "lg" }) {
  const initials = (user.name || user.email).charAt(0).toUpperCase();
  const sizeClass = size === "sm" ? "h-7 w-7 text-xs" : size === "lg" ? "h-11 w-11 text-base" : "h-9 w-9 text-sm";
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold flex items-center justify-center ring-2 ring-background shrink-0`}>
      {initials}
    </div>
  );
}

export default function TeamPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [createError, setCreateError] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteError, setInviteError] = useState("");

  const [properties, setProperties] = useState<Property[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // New assignment form
  const [aTitle, setATitle] = useState("");
  const [aDesc, setADesc] = useState("");
  const [aPriority, setAPriority] = useState("medium");
  const [aDueDate, setADueDate] = useState("");
  const [aPropertyId, setAPropertyId] = useState("");
  const [aAssigneeId, setAAssigneeId] = useState("");
  const [aSubmitting, setASubmitting] = useState(false);
  const [aError, setAError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/team").then((r) => r.json()),
      fetch("/api/gsc/properties").then((r) => r.json()),
      fetch("/api/team/assignments").then((r) => r.json()),
    ]).then(([me, teamData, propData, assignData]) => {
      setCurrentUserId(me?.user?.id ?? "");
      setTeam(teamData.team ?? null);
      setProperties(propData.properties ?? []);
      setAssignments(assignData.assignments ?? []);
    }).finally(() => setLoading(false));
  }, []);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: teamName || "My Team" }),
    });
    const data = await res.json();
    if (!res.ok) setCreateError(data.error ?? "Failed");
    else setTeam(data.team);
    setCreating(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError("");
    setInviteMsg("");
    const res = await fetch("/api/team/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setInviteError(data.error ?? "Failed");
    } else {
      setInviteMsg(
        data.autoAccepted
          ? `${data.user?.name ?? inviteEmail} added to team as ${inviteRole}.`
          : `Invite sent to ${inviteEmail}.`
      );
      setInviteEmail("");
      const refreshed = await fetch("/api/team").then((r) => r.json());
      setTeam(refreshed.team ?? null);
    }
    setInviting(false);
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Remove this member from the team?")) return;
    await fetch(`/api/team/members/${memberId}`, { method: "DELETE" });
    setTeam((t) => t ? { ...t, members: t.members.filter((m) => m.id !== memberId) } : t);
  }

  async function handleRoleChange(memberId: string, role: string) {
    const res = await fetch(`/api/team/members/${memberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setTeam((t) => t
        ? { ...t, members: t.members.map((m) => m.id === memberId ? { ...m, role } : m) }
        : t
      );
    }
  }

  async function handleCancelInvite(inviteId: string) {
    await fetch(`/api/team/invites?id=${inviteId}`, { method: "DELETE" });
    setTeam((t) => t ? { ...t, invites: t.invites.filter((i) => i.id !== inviteId) } : t);
  }

  async function handleCreateAssignment(e: React.FormEvent) {
    e.preventDefault();
    setASubmitting(true);
    setAError("");
    const res = await fetch("/api/team/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: aPropertyId,
        assignedToId: aAssigneeId,
        title: aTitle,
        description: aDesc,
        priority: aPriority,
        dueDate: aDueDate || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAError(data.error ?? "Failed to create assignment");
    } else {
      setAssignments((prev) => [data.assignment, ...prev]);
      setATitle(""); setADesc(""); setADueDate(""); setAPropertyId(""); setAAssigneeId("");
    }
    setASubmitting(false);
  }

  async function handleStatusChange(assignId: string, status: string) {
    setAssignLoading(true);
    const res = await fetch(`/api/team/assignments/${assignId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = await res.json();
      setAssignments((prev) => prev.map((a) => a.id === assignId ? data.assignment : a));
    }
    setAssignLoading(false);
  }

  async function handleDeleteAssignment(assignId: string) {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/team/assignments/${assignId}`, { method: "DELETE" });
    setAssignments((prev) => prev.filter((a) => a.id !== assignId));
  }

  const isOwner = team?.owner.id === currentUserId;
  const myMembership = team?.members.find((m) => m.user.id === currentUserId);
  const isLeader = isOwner || myMembership?.role === "leader";

  const allMembers: TeamUser[] = team
    ? [team.owner, ...team.members.map((m) => m.user)]
    : [];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-12 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading team…
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-12 space-y-6">
        <PageHeader
          icon={Users}
          title="Team Management"
          description="Create a team to collaborate with other users on properties and SEO tasks."
          accent="blue"
        />
        <Card className="border-dashed">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <CardTitle>Create your team</CardTitle>
            <CardDescription>Invite colleagues and assign them SEO tasks by property.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="space-y-4 max-w-sm mx-auto">
              <div className="space-y-1.5">
                <Label htmlFor="teamName">Team name</Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Acme SEO Team"
                />
              </div>
              {createError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                {creating ? "Creating…" : "Create Team"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8 space-y-6">
      <PageHeader
        icon={Users}
        title={team.name}
        description={`${team.members.length + 1} member${team.members.length !== 0 ? "s" : ""} · Managed by ${team.owner.name ?? team.owner.email}`}
        accent="blue"
      />

      <Tabs defaultValue="members">
        <TabsList className="h-10">
          <TabsTrigger value="members" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Members
            <Badge variant="secondary" className="ml-1 text-xs">{team.members.length + 1}</Badge>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Tasks
            <Badge variant="secondary" className="ml-1 text-xs">{assignments.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── MEMBERS TAB ── */}
        <TabsContent value="members" className="space-y-4 mt-4">
          <div className="grid lg:grid-cols-[1fr_340px] gap-4">
            {/* Member list */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Team Members</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 p-3">
                {/* Owner row */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                  <Avatar user={team.owner} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{team.owner.name ?? team.owner.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{team.owner.email}</p>
                  </div>
                  <Badge className="gap-1 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20">
                    <Crown className="h-3 w-3" /> Owner
                  </Badge>
                </div>

                {team.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors group">
                    <Avatar user={m.user} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{m.user.name ?? m.user.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isOwner ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                          className="h-7 text-xs rounded-md border border-input bg-background px-2"
                        >
                          <option value="member">Member</option>
                          <option value="leader">Leader</option>
                        </select>
                      ) : (
                        <Badge variant="outline" className="text-xs capitalize">{m.role}</Badge>
                      )}
                      {(isOwner || m.user.id === currentUserId) && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Invite panel */}
            {isOwner && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Invite Member
                    </CardTitle>
                    <CardDescription className="text-xs">
                      If the email matches an existing account, they are added immediately.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleInvite} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Email address</Label>
                        <Input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="colleague@company.com"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Role</Label>
                        <div className="flex gap-2">
                          {["member", "leader"].map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setInviteRole(r)}
                              className={`flex-1 h-9 rounded-md border text-sm capitalize transition-colors ${
                                inviteRole === r
                                  ? "border-primary bg-primary/5 text-primary font-medium"
                                  : "border-input text-muted-foreground hover:border-muted-foreground"
                              }`}
                            >
                              {r === "leader" ? <span className="flex items-center justify-center gap-1"><Crown className="h-3.5 w-3.5" />Leader</span> : "Member"}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Leaders can create and assign tasks.</p>
                      </div>
                      {inviteError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">{inviteError}</AlertDescription>
                        </Alert>
                      )}
                      {inviteMsg && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">{inviteMsg}</AlertDescription>
                        </Alert>
                      )}
                      <Button type="submit" className="w-full" disabled={inviting}>
                        {inviting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                        {inviting ? "Sending…" : "Send Invite"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Pending invites */}
                {team.invites.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Pending Invites</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {team.invites.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between gap-2 group">
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{inv.email}</p>
                            <p className="text-xs text-muted-foreground capitalize">{inv.role} · expires {new Date(inv.expiresAt).toLocaleDateString()}</p>
                          </div>
                          <button
                            onClick={() => handleCancelInvite(inv.id)}
                            className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── TASKS TAB ── */}
        <TabsContent value="tasks" className="space-y-4 mt-4">
          <div className="grid lg:grid-cols-[1fr_340px] gap-4">
            {/* Task list */}
            <div className="space-y-3">
              {assignments.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No tasks yet.</p>
                    {isLeader && <p className="text-xs text-muted-foreground mt-1">Create a task using the form →</p>}
                  </CardContent>
                </Card>
              ) : (
                assignments.map((a) => {
                  const pri = PRIORITY_CONFIG[a.priority] ?? PRIORITY_CONFIG.medium;
                  const sta = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.open;
                  return (
                    <Card key={a.id} className="hover:border-primary/30 transition-colors">
                      <CardContent className="py-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <p className="font-medium text-sm leading-snug">{a.title}</p>
                            {a.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                            )}
                          </div>
                          {(isLeader) && (
                            <button
                              onClick={() => handleDeleteAssignment(a.id)}
                              className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${pri.className}`}>
                            <Flag className="h-3 w-3" />
                            {pri.label}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sta.className}`}>
                            {sta.label}
                          </span>
                          {a.dueDate && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground border border-border">
                              <Calendar className="h-3 w-3" />
                              {new Date(a.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-border/60">
                          <div className="flex items-center gap-2">
                            <Avatar user={a.assignedTo} size="sm" />
                            <div>
                              <p className="text-xs font-medium">{a.assignedTo.name ?? a.assignedTo.email}</p>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Globe className="h-2.5 w-2.5" />
                                {a.property.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                              </p>
                            </div>
                          </div>
                          <select
                            value={a.status}
                            disabled={assignLoading}
                            onChange={(e) => handleStatusChange(a.id, e.target.value)}
                            className="h-7 text-xs rounded-md border border-input bg-background px-2"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                            <option value="blocked">Blocked</option>
                          </select>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Create task form — only for leaders/owners */}
            {isLeader && (
              <Card className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Task
                  </CardTitle>
                  <CardDescription className="text-xs">Assign a property task to a team member.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateAssignment} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Task title</Label>
                      <Input value={aTitle} onChange={(e) => setATitle(e.target.value)} placeholder="Fix meta descriptions on blog" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Description</Label>
                      <Textarea value={aDesc} onChange={(e) => setADesc(e.target.value)} placeholder="Optional details…" rows={2} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Priority</Label>
                        <select
                          value={aPriority}
                          onChange={(e) => setAPriority(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Due date</Label>
                        <Input type="date" value={aDueDate} onChange={(e) => setADueDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Property</Label>
                      <select
                        value={aPropertyId}
                        onChange={(e) => setAPropertyId(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        required
                      >
                        <option value="">Select property…</option>
                        {properties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Assign to</Label>
                      <select
                        value={aAssigneeId}
                        onChange={(e) => setAAssigneeId(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        required
                      >
                        <option value="">Select member…</option>
                        {allMembers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name ?? u.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    {aError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">{aError}</AlertDescription>
                      </Alert>
                    )}
                    <Button type="submit" className="w-full" disabled={aSubmitting}>
                      {aSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ClipboardList className="h-4 w-4 mr-2" />}
                      {aSubmitting ? "Creating…" : "Create Task"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
