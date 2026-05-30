"use client";

import { Download, RotateCcw, Trash2, Upload } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { CATEGORY_COLORS } from "@/constants/categories";
import { downloadFile } from "@/lib/utils";
import { expensesToCsv, parseExpenseCsv } from "@/services/api-client";
import { useCatStore } from "@/store/use-cat-store";

export default function SettingsPage() {
  const expenses = useCatStore((state) => state.expenses);
  const categories = useCatStore((state) => state.categories);
  const preferences = useCatStore((state) => state.preferences);
  const setPreferences = useCatStore((state) => state.setPreferences);
  const addCategory = useCatStore((state) => state.addCategory);
  const removeCategory = useCatStore((state) => state.removeCategory);
  const projects = useCatStore((state) => state.projects);
  const invites = useCatStore((state) => state.invites);
  const members = useCatStore((state) => state.members);
  const currentUser = useCatStore((state) => state.currentUser);
  const selectedProjectId = useCatStore((state) => state.selectedProjectId);
  const createProject = useCatStore((state) => state.createProject);
  const addProjectMember = useCatStore((state) => state.addProjectMember);
  const removeProjectMember = useCatStore((state) => state.removeProjectMember);
  const respondToInvite = useCatStore((state) => state.respondToInvite);
  const importExpenses = useCatStore((state) => state.importExpenses);
  const resetAll = useCatStore((state) => state.resetAll);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState(CATEGORY_COLORS[0]);
  const [projectName, setProjectName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");

  function exportJson() {
    downloadFile(`cat-expense-backup-${Date.now()}.json`, JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), expenses, categories, preferences }, null, 2), "application/json");
  }

  function exportCsv() {
    downloadFile(`cat-expenses-${Date.now()}.csv`, expensesToCsv(expenses), "text/csv");
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const imported = file.name.endsWith(".csv") ? parseExpenseCsv(text) : JSON.parse(text).expenses;
    await importExpenses(imported);
    toast.success(`${imported.length} expenses imported`);
    event.target.value = "";
  }

  async function onAddCategory() {
    if (!categoryName.trim()) return;
    try {
      await addCategory({ name: categoryName.trim(), color: categoryColor, icon: "Tag", isFavorite: false });
      setCategoryName("");
      toast.success("Category saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save category");
    }
  }

  async function onCreateProject() {
    if (!projectName.trim()) return;
    try {
      await createProject({ name: projectName.trim(), color: categoryColor, icon: "Wallet" });
      setProjectName("");
      toast.success("Project created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create project");
    }
  }

  async function onInviteMember() {
    if (!memberEmail.trim()) return;
    try {
      await addProjectMember(memberEmail.trim(), "member");
      setMemberEmail("");
      toast.success("Invite sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not invite member");
    }
  }

  return (
    <div className="grid gap-5">
      <header className="pr-12">
        <h1 className="text-4xl font-bold tracking-normal">Settings</h1>
        <p className="mt-2 text-[var(--muted)]">Theme, projects, invites, categories, backup, and data tools.</p>
      </header>

      <Card className="grid gap-4">
        <Select label="Theme" value={preferences.theme} onChange={(event) => setPreferences({ theme: event.target.value as typeof preferences.theme })}>
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </Select>
        <Field label="Monthly Budget" inputMode="decimal" type="number" value={preferences.budgetMonthly} onChange={(event) => setPreferences({ budgetMonthly: Number(event.target.value) })} />
        <Field label="Budget Alert Percent" inputMode="numeric" type="number" value={preferences.budgetAlertPercent} onChange={(event) => setPreferences({ budgetAlertPercent: Number(event.target.value) })} />
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-xl font-bold">Projects</h2>
        {projects.length === 0 && <p className="text-sm text-[var(--muted)]">No projects yet. Create one or accept an invite below.</p>}
        <Field label="New Project" value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Cat Food Tracker" />
        <Button type="button" onClick={onCreateProject}>Create Project</Button>

        {invites.length > 0 && (
          <div className="grid gap-2">
            <h3 className="font-bold">Pending Invites</h3>
            {invites.map((invite) => (
              <div key={invite.id} className="grid gap-2 rounded-2xl bg-teal-500/10 p-3 text-sm">
                <p className="font-bold">{invite.projectName}</p>
                <p className="text-[var(--muted)]">Invited by {invite.invitedByName} as {invite.role}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" size="sm" onClick={() => void respondToInvite(invite.id, true).then(() => toast.success("Invite accepted")).catch((error) => toast.error(error instanceof Error ? error.message : "Could not accept invite"))}>Accept</Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => void respondToInvite(invite.id, false).then(() => toast.success("Invite declined")).catch((error) => toast.error(error instanceof Error ? error.message : "Could not decline invite"))}>Decline</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-2">
          {projects.map((project) => (
            <div key={project.id} className="rounded-2xl bg-black/5 px-3 py-3 text-sm dark:bg-white/10">
              <p className="font-bold">{project.name}</p>
              <p className="text-[var(--muted)]">{project.role} · {project.memberCount} people{project.id === selectedProjectId ? " · selected" : ""}</p>
            </div>
          ))}
        </div>
        {members.length > 0 && (
          <div className="grid gap-2">
            <h3 className="font-bold">Members</h3>
            {members.map((member) => (
              <div key={member.userId} className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-black/5 px-3 py-2 dark:bg-white/10">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{member.name}{member.userId === currentUser?.id ? " (me)" : ""}</p>
                  <p className="truncate text-xs text-[var(--muted)]">{member.email} · {member.role}</p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={member.userId === currentUser?.id}
                  onClick={() => void removeProjectMember(member.userId).then(() => toast.success("Member removed")).catch((error) => toast.error(error instanceof Error ? error.message : "Could not remove member"))}
                  aria-label={`Remove ${member.name}`}
                >
                  <Trash2 size={17} />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Field label="Invite Member Email" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="friend@gmail.com" />
        <Button type="button" variant="secondary" onClick={onInviteMember}>Send Invite To Selected Project</Button>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-xl font-bold">Manage Categories</h2>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Field label="New Category" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Insurance" />
          <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
            Color
            <input aria-label="Category color" type="color" value={categoryColor} onChange={(event) => setCategoryColor(event.target.value)} className="h-12 w-14 rounded-2xl border border-[var(--border)] bg-transparent" />
          </label>
        </div>
        <Button type="button" onClick={onAddCategory}>Add Category</Button>
        <div className="grid gap-2">
          {categories.map((category) => (
            <div key={category.id} className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-black/5 px-3 dark:bg-white/10">
              <span className="flex items-center gap-2 font-semibold"><span className="h-3 w-3 rounded-full" style={{ background: category.color }} />{category.name}</span>
              <Button type="button" size="icon" variant="ghost" disabled={category.isDefault} onClick={() => void removeCategory(category.id).catch((error) => toast.error(error instanceof Error ? error.message : "Could not delete category"))} aria-label={`Delete ${category.name}`}>
                <Trash2 size={17} />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="grid gap-3">
        <h2 className="text-xl font-bold">Data Management</h2>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={exportCsv}><Download size={18} />CSV</Button>
          <Button type="button" variant="secondary" onClick={exportJson}><Download size={18} />JSON</Button>
        </div>
        <label className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-black/5 px-4 font-bold dark:bg-white/10">
          <Upload size={18} />
          Import / Restore
          <input type="file" accept=".csv,.json,application/json,text/csv" className="sr-only" onChange={importFile} />
        </label>
        <Button type="button" variant="danger" onClick={() => { if (window.confirm("Reset local cached data and preferences? Database rows are not deleted.")) resetAll(); }}>
          <RotateCcw size={18} />
          Reset Local Data
        </Button>
      </Card>
    </div>
  );
}
