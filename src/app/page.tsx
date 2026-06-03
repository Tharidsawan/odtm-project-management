"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Project = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  milestones: { id: string }[];
  members: { id: string }[];
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", startDate: "", endDate: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects").then((r) => r.json()).then((data) => { setProjects(data); setLoading(false); });
  }, []);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status: "active" }),
    });
    const project = await res.json();
    setProjects([project, ...projects]);
    setShowForm(false);
    setForm({ name: "", description: "", startDate: "", endDate: "" });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">ODT/M Project Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New Project
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-lg font-bold mb-4">Create New Project</h2>
              <form onSubmit={createProject} className="space-y-3">
                <input required placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={3} />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-sm text-gray-500">Start Date</label>
                    <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-gray-500">End Date</label>
                    <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Create</button>
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">No projects yet</p>
            <p className="mt-2">Click &quot;+ New Project&quot; to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{p.name}</h2>
                    {p.description && <p className="text-gray-500 mt-1 text-sm">{p.description}</p>}
                    <div className="flex gap-4 mt-3 text-sm text-gray-400">
                      <span>{new Date(p.startDate).toLocaleDateString()} → {new Date(p.endDate).toLocaleDateString()}</span>
                      <span>{(p.milestones ?? []).length} milestones</span>
                      <span>{(p.members ?? []).length} members</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.status === "active" ? "bg-green-100 text-green-700" : p.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                    {p.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
