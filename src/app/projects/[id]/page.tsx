"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import GanttChart from "@/components/GanttChart";
import SCurve from "@/components/SCurve";

type Task = { id: string; name: string; description: string; startDate: string; endDate: string; progress: number; color: string; order: number };
type Milestone = { id: string; name: string; description: string; dueDate: string; completed: boolean };
type Member = { id: string; name: string; role: string; email: string; parentId: string | null; children: Member[] };
type WeeklyProgress = { id: string; weekDate: string; planPct: number; actualPct: number };
type Project = { id: string; name: string; description: string; startDate: string; endDate: string; status: string; milestones: Milestone[]; members: Member[]; tasks: Task[]; weeklyProgress: WeeklyProgress[] };

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<"gantt" | "scurve" | "milestones" | "orgchart">("gantt");
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ name: "", description: "", dueDate: "" });
  const [memberForm, setMemberForm] = useState({ name: "", role: "", email: "", parentId: "" });

  const fetchProject = useCallback(() => {
    fetch(`/api/projects/${id}`).then((r) => r.json()).then(setProject);
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/milestones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...milestoneForm, projectId: id }),
    });
    setShowMilestoneForm(false);
    setMilestoneForm({ name: "", description: "", dueDate: "" });
    fetchProject();
  }

  async function toggleMilestone(m: Milestone) {
    await fetch(`/api/milestones/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...m, completed: !m.completed }),
    });
    fetchProject();
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...memberForm, parentId: memberForm.parentId || null, projectId: id }),
    });
    setShowMemberForm(false);
    setMemberForm({ name: "", role: "", email: "", parentId: "" });
    fetchProject();
  }

  function OrgNode({ member }: { member: Member }) {
    const children = project?.members.filter((m) => m.parentId === member.id) ?? [];
    return (
      <div className="flex flex-col items-center">
        <div className="bg-white border-2 border-blue-200 rounded-xl px-4 py-3 text-center shadow-sm min-w-[130px]">
          <div className="font-semibold text-gray-800 text-sm">{member.name}</div>
          <div className="text-xs text-blue-600 mt-0.5">{member.role}</div>
          {member.email && <div className="text-xs text-gray-400 mt-0.5">{member.email}</div>}
        </div>
        {children.length > 0 && (
          <div className="flex gap-6 mt-4">
            {children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-4 bg-gray-300" />
                <OrgNode member={child} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!project) return <div className="p-8 text-gray-500">Loading...</div>;

  const rootMembers = project.members.filter((m) => !m.parentId);
  const tabs = [
    { key: "gantt", label: "Gantt Chart" },
    { key: "scurve", label: "S-Curve" },
    { key: "milestones", label: "Milestones" },
    { key: "orgchart", label: "Org Chart" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{project.name}</h1>
            {project.description && <p className="text-sm text-gray-500">{project.description}</p>}
          </div>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${project.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
            {project.status}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6 border-b pb-0">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "gantt" && <GanttChart project={project} onRefresh={fetchProject} />}

        {tab === "scurve" && (
          <SCurve projectId={project.id} weeklyProgress={project.weeklyProgress ?? []} onRefresh={fetchProject} />
        )}

        {tab === "milestones" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button onClick={() => setShowMilestoneForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Add Milestone</button>
            </div>
            {showMilestoneForm && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                  <h2 className="text-lg font-bold mb-4">Add Milestone</h2>
                  <form onSubmit={addMilestone} className="space-y-3">
                    <input required placeholder="Milestone name" value={milestoneForm.name} onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                    <textarea placeholder="Description" value={milestoneForm.description} onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} />
                    <div>
                      <label className="text-sm text-gray-500">Due Date</label>
                      <input required type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Add</button>
                      <button type="button" onClick={() => setShowMilestoneForm(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {project.milestones.length === 0 ? (
              <p className="text-gray-400 text-center py-10">No milestones yet</p>
            ) : (
              project.milestones.map((m) => (
                <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-3">
                  <input type="checkbox" checked={m.completed} onChange={() => toggleMilestone(m)} className="mt-1 w-4 h-4 accent-blue-600 cursor-pointer" />
                  <div className={m.completed ? "opacity-60 line-through" : ""}>
                    <p className="font-medium text-gray-800">{m.name}</p>
                    {m.description && <p className="text-sm text-gray-500">{m.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">Due: {new Date(m.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "orgchart" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowMemberForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Add Member</button>
            </div>
            {showMemberForm && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                  <h2 className="text-lg font-bold mb-4">Add Member</h2>
                  <form onSubmit={addMember} className="space-y-3">
                    <input required placeholder="Name" value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                    <input required placeholder="Role / Position" value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                    <input type="email" placeholder="Email (optional)" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                    <div>
                      <label className="text-sm text-gray-500">Reports to (optional)</label>
                      <select value={memberForm.parentId} onChange={(e) => setMemberForm({ ...memberForm, parentId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                        <option value="">— None (top level) —</option>
                        {project.members.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                      </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Add</button>
                      <button type="button" onClick={() => setShowMemberForm(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {rootMembers.length === 0 ? (
              <p className="text-gray-400 text-center py-10">No members yet</p>
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 overflow-x-auto">
                <div className="flex gap-8 justify-center">
                  {rootMembers.map((m) => <OrgNode key={m.id} member={m} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
