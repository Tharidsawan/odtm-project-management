"use client";
import { useState } from "react";

type Task = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  progress: number;
  color: string;
  order: number;
};

type Milestone = {
  id: string;
  name: string;
  dueDate: string;
  completed: boolean;
};

type Project = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  tasks: Task[];
  milestones: Milestone[];
};

const COLORS = [
  { label: "Blue", value: "blue", bar: "#93C5FD" },
  { label: "Green", value: "green", bar: "#86EFAC" },
  { label: "Orange", value: "orange", bar: "#FDC093" },
  { label: "Purple", value: "purple", bar: "#C4B5FD" },
  { label: "Gray", value: "gray", bar: "#D1D5DB" },
];

function getBarColor(color: string) {
  return COLORS.find((c) => c.value === color)?.bar ?? "#93C5FD";
}

function getMonths(startDate: string, endDate: string) {
  const start = new Date(startDate); start.setDate(1);
  const end = new Date(endDate); end.setDate(1);
  const months: { year: number; month: number; label: string }[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth(), label: cur.toLocaleString("en", { month: "short" }).toUpperCase() });
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

function getQuarters(months: { year: number; month: number; label: string }[]) {
  const qMap: Record<string, number> = {};
  months.forEach((m) => {
    const q = `Q${Math.floor(m.month / 3) + 1}'${String(m.year).slice(2)}`;
    qMap[q] = (qMap[q] ?? 0) + 1;
  });
  return Object.entries(qMap).map(([label, span]) => ({ label, span }));
}

function posPercent(date: string, rangeStart: string, rangeEnd: string) {
  const s = new Date(rangeStart).getTime();
  const e = new Date(rangeEnd).getTime();
  const d = new Date(date).getTime();
  return Math.min(100, Math.max(0, ((d - s) / (e - s)) * 100));
}

function barPercents(task: Task, rangeStart: string, rangeEnd: string) {
  const s = new Date(rangeStart).getTime();
  const e = new Date(rangeEnd).getTime();
  const ts = new Date(task.startDate).getTime();
  const te = new Date(task.endDate).getTime();
  const left = Math.min(100, Math.max(0, ((ts - s) / (e - s)) * 100));
  const right = Math.min(100, Math.max(0, ((te - s) / (e - s)) * 100));
  return { left, width: right - left };
}

export default function GanttChart({ project, onRefresh }: { project: Project; onRefresh: () => void }) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({ name: "", description: "", startDate: "", endDate: "", progress: 0, color: "blue" });

  const months = getMonths(project.startDate, project.endDate);
  const quarters = getQuarters(months);
  const today = new Date().toISOString();
  const todayPos = posPercent(today, project.startDate, project.endDate);

  const totalDays = (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / 86400000;
  const elapsed = (Date.now() - new Date(project.startDate).getTime()) / 86400000;
  const overallProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));

  function openAdd() {
    setEditTask(null);
    setTaskForm({ name: "", description: "", startDate: "", endDate: "", progress: 0, color: "blue" });
    setShowTaskForm(true);
  }

  function openEdit(task: Task) {
    setEditTask(task);
    setTaskForm({
      name: task.name,
      description: task.description ?? "",
      startDate: task.startDate.split("T")[0],
      endDate: task.endDate.split("T")[0],
      progress: task.progress,
      color: task.color,
    });
    setShowTaskForm(true);
  }

  async function saveTask(e: React.FormEvent) {
    e.preventDefault();
    if (editTask) {
      await fetch(`/api/tasks/${editTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskForm, order: editTask.order }),
      });
    } else {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskForm, projectId: project.id, order: project.tasks.length }),
      });
    }
    setShowTaskForm(false);
    setEditTask(null);
    onRefresh();
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    onRefresh();
  }

  async function updateProgress(task: Task, progress: number) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...task, startDate: task.startDate.split("T")[0], endDate: task.endDate.split("T")[0], progress }),
    });
    onRefresh();
  }

  return (
    <div className="space-y-4">
      {/* Header summary */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-wrap gap-6 items-center">
        <div className="border-2 border-blue-300 rounded-lg px-4 py-2 text-center">
          <div className="text-xs text-gray-500 font-medium">DATA AS OF</div>
          <div className="text-sm font-bold text-blue-700 mt-1">{new Date().toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 font-medium uppercase">Overall Progress</div>
          <div className="text-3xl font-bold text-green-600 mt-1">{overallProgress}%</div>
          <div className="w-32 h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 font-medium uppercase">Project Duration</div>
          <div className="text-sm font-bold text-green-600 mt-1">
            {new Date(project.startDate).toLocaleDateString("en", { month: "short", year: "numeric" })} – {new Date(project.endDate).toLocaleDateString("en", { month: "short", year: "numeric" })}
          </div>
          <div className="text-xs text-gray-400 mt-1">{Math.ceil(totalDays / 30)} Months</div>
        </div>
        <div className="ml-auto">
          <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Add Task</button>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">{editTask ? "Edit Task" : "Add Task"}</h2>
            <form onSubmit={saveTask} className="space-y-3">
              <input required placeholder="Task name" value={taskForm.name} onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              <textarea placeholder="Description (optional)" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm text-gray-500">Start Date</label>
                  <input required type="date" value={taskForm.startDate} onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-500">End Date</label>
                  <input required type="date" value={taskForm.endDate} onChange={(e) => setTaskForm({ ...taskForm, endDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Progress: {taskForm.progress}%</label>
                <input type="range" min={0} max={100} value={taskForm.progress}
                  onChange={(e) => setTaskForm({ ...taskForm, progress: Number(e.target.value) })}
                  className="w-full accent-blue-600" />
              </div>
              <div>
                <label className="text-sm text-gray-500">Color</label>
                <div className="flex gap-2 mt-1">
                  {COLORS.map((c) => (
                    <button key={c.value} type="button" onClick={() => setTaskForm({ ...taskForm, color: c.value })}
                      className="w-7 h-7 rounded-full border-2"
                      style={{ backgroundColor: c.bar, borderColor: taskForm.color === c.value ? "#2563EB" : "transparent" }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{editTask ? "Save" : "Add"}</button>
                <button type="button" onClick={() => setShowTaskForm(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gantt Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: 900 }}>
            {/* Quarter header */}
            <div className="flex border-b">
              <div className="w-56 shrink-0 bg-[#1a3a5c] border-r border-gray-300" />
              <div className="flex flex-1">
                {quarters.map((q) => (
                  <div key={q.label} className="bg-[#1a3a5c] text-white text-xs font-bold text-center py-2 border-r border-blue-800" style={{ flex: q.span }}>
                    {q.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Month header */}
            <div className="flex border-b">
              <div className="w-56 shrink-0 bg-[#1a3a5c] text-white text-xs font-bold px-3 py-2 border-r border-gray-300 flex items-center">TASK / ACTIVITY</div>
              <div className="flex flex-1">
                {months.map((m, i) => (
                  <div key={i} className="flex-1 bg-[#2a5082] text-white text-xs font-bold text-center py-2 border-r border-blue-800">{m.label}</div>
                ))}
              </div>
            </div>

            {/* Task rows */}
            {project.tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No tasks yet — click &quot;+ Add Task&quot; to start</div>
            ) : (
              project.tasks.map((task) => {
                const { left, width } = barPercents(task, project.startDate, project.endDate);
                const barColor = getBarColor(task.color);
                return (
                  <div key={task.id} className="flex border-b hover:bg-gray-50 group">
                    <div className="w-56 shrink-0 px-3 py-3 border-r border-gray-200">
                      <div className="font-semibold text-gray-800 text-sm">{task.name}</div>
                      {task.description && <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{task.description}</div>}
                      <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(task)} className="text-xs text-blue-500 hover:text-blue-700">edit</button>
                        <button onClick={() => deleteTask(task.id)} className="text-xs text-red-400 hover:text-red-600">delete</button>
                      </div>
                    </div>
                    <div className="flex-1 relative" style={{ minHeight: 52 }}>
                      {/* Today line */}
                      <div className="absolute top-0 bottom-0 w-px bg-red-400 opacity-50 z-10 pointer-events-none" style={{ left: `${todayPos}%` }} />
                      {/* Bar background */}
                      <div className="absolute rounded" style={{ top: 10, bottom: 10, left: `${left}%`, width: `${Math.max(width, 0.5)}%`, backgroundColor: barColor, opacity: 0.4 }} />
                      {/* Progress bar */}
                      <div className="absolute rounded" style={{ top: 10, bottom: 10, left: `${left}%`, width: `${(width * task.progress) / 100}%`, backgroundColor: barColor }} />
                      {/* Progress label */}
                      {width > 8 && (
                        <div className="absolute flex items-center justify-center text-xs font-bold text-gray-700 pointer-events-none"
                          style={{ top: 10, bottom: 10, left: `${left}%`, width: `${width}%` }}>
                          {task.progress}%
                        </div>
                      )}
                      {/* Inline progress slider — shown on hover */}
                      <div className="absolute bottom-1 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        style={{ left: `${left}%`, width: `${Math.max(width, 10)}%`, minWidth: 80 }}>
                        <input type="range" min={0} max={100} value={task.progress}
                          onChange={(e) => updateProgress(task, Number(e.target.value))}
                          className="w-full h-1 accent-blue-600 cursor-pointer"
                          onClick={(e) => e.stopPropagation()} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Milestones row */}
            {project.milestones.length > 0 && (
              <div className="flex border-b bg-gray-50">
                <div className="w-56 shrink-0 px-3 py-2 border-r border-gray-200 text-xs font-semibold text-gray-500 uppercase flex items-center">Milestones</div>
                <div className="flex-1 relative" style={{ minHeight: 48 }}>
                  <div className="absolute top-0 bottom-0 w-px bg-red-400 opacity-50" style={{ left: `${todayPos}%` }} />
                  {project.milestones.map((m) => {
                    const pos = posPercent(m.dueDate, project.startDate, project.endDate);
                    return (
                      <div key={m.id} className="absolute z-20 flex flex-col items-center" style={{ left: `${pos}%`, top: 4, transform: "translateX(-50%)" }}>
                        <span className="text-base leading-none">{m.completed ? "✅" : "🚩"}</span>
                        <span className="text-xs text-gray-600 whitespace-nowrap mt-0.5 bg-white px-1 rounded shadow-sm border">{m.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Today label */}
            <div className="flex h-6 relative">
              <div className="w-56 shrink-0 border-r border-gray-200" />
              <div className="flex-1 relative">
                <div className="absolute top-0 h-full w-px bg-red-400 opacity-50" style={{ left: `${todayPos}%` }} />
                <div className="absolute text-xs text-red-500 font-bold" style={{ left: `${todayPos}%`, transform: "translateX(-50%)" }}>Today</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
