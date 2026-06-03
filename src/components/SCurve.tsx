"use client";
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

type WeeklyProgress = {
  id: string;
  weekDate: string;
  planPct: number;
  actualPct: number;
};

type Props = {
  projectId: string;
  weeklyProgress: WeeklyProgress[];
  onRefresh: () => void;
};

function getMondayStr(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export default function SCurve({ projectId, weeklyProgress, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<WeeklyProgress | null>(null);
  const [form, setForm] = useState({ weekDate: getMondayStr(new Date()), planPct: 0, actualPct: 0 });

  const today = getMondayStr(new Date());

  const chartData = weeklyProgress.map((w) => ({
    id: w.id,
    week: new Date(w.weekDate).toLocaleDateString("en", { day: "numeric", month: "short" }),
    weekDate: w.weekDate,
    Plan: w.planPct,
    Actual: w.actualPct,
  }));

  async function saveEntry(e: React.FormEvent) {
    e.preventDefault();
    if (editRow) {
      await fetch(`/api/weekly-progress/${editRow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planPct: form.planPct, actualPct: form.actualPct }),
      });
    } else {
      await fetch("/api/weekly-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, projectId }),
      });
    }
    setShowForm(false);
    setEditRow(null);
    setForm({ weekDate: getMondayStr(new Date()), planPct: 0, actualPct: 0 });
    onRefresh();
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/weekly-progress/${id}`, { method: "DELETE" });
    onRefresh();
  }

  function openEdit(w: WeeklyProgress) {
    setEditRow(w);
    setForm({ weekDate: w.weekDate.split("T")[0], planPct: w.planPct, actualPct: w.actualPct });
    setShowForm(true);
  }

  const latestActual = weeklyProgress.length > 0 ? weeklyProgress[weeklyProgress.length - 1].actualPct : 0;
  const latestPlan = weeklyProgress.length > 0 ? weeklyProgress[weeklyProgress.length - 1].planPct : 0;
  const variance = latestActual - latestPlan;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-xs text-gray-500 uppercase font-medium">Plan %</div>
          <div className="text-3xl font-bold text-blue-600 mt-1">{latestPlan.toFixed(1)}%</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-xs text-gray-500 uppercase font-medium">Actual %</div>
          <div className="text-3xl font-bold text-green-600 mt-1">{latestActual.toFixed(1)}%</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-xs text-gray-500 uppercase font-medium">Variance</div>
          <div className={`text-3xl font-bold mt-1 ${variance >= 0 ? "text-green-600" : "text-red-500"}`}>
            {variance >= 0 ? "+" : ""}{variance.toFixed(1)}%
          </div>
          <div className={`text-xs mt-1 ${variance >= 0 ? "text-green-500" : "text-red-400"}`}>
            {variance >= 0 ? "Ahead of plan" : "Behind plan"}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">S-Curve — Plan vs Actual</h3>
          <button onClick={() => { setEditRow(null); setForm({ weekDate: getMondayStr(new Date()), planPct: 0, actualPct: 0 }); setShowForm(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            + Add Week
          </button>
        </div>

        {chartData.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No data yet — click &quot;+ Add Week&quot; to start tracking</div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Legend />
              <ReferenceLine y={100} stroke="#e5e7eb" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="Plan" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Actual" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} strokeDasharray="0" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Weekly data table */}
      {weeklyProgress.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Week</th>
                <th className="text-center px-4 py-3 text-blue-500 font-medium">Plan %</th>
                <th className="text-center px-4 py-3 text-green-500 font-medium">Actual %</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Variance</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {[...weeklyProgress].reverse().map((w) => {
                const v = w.actualPct - w.planPct;
                return (
                  <tr key={w.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700">
                      {new Date(w.weekDate).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-center text-blue-600 font-semibold">{w.planPct.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center text-green-600 font-semibold">{w.actualPct.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {v >= 0 ? "+" : ""}{v.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(w)} className="text-blue-400 hover:text-blue-600 text-xs mr-3">edit</button>
                      <button onClick={() => deleteEntry(w.id)} className="text-red-400 hover:text-red-600 text-xs">delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold mb-4">{editRow ? "Edit Week" : "Add Week"}</h2>
            <form onSubmit={saveEntry} className="space-y-3">
              {!editRow && (
                <div>
                  <label className="text-sm text-gray-500">Week Starting (Monday)</label>
                  <input type="date" required value={form.weekDate}
                    onChange={(e) => setForm({ ...form, weekDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2" />
                </div>
              )}
              <div>
                <label className="text-sm text-gray-500">Plan % (Cumulative)</label>
                <input type="number" min={0} max={100} step={0.1} required value={form.planPct}
                  onChange={(e) => setForm({ ...form, planPct: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-500">Actual % (Cumulative)</label>
                <input type="number" min={0} max={100} step={0.1} required value={form.actualPct}
                  onChange={(e) => setForm({ ...form, actualPct: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save</button>
                <button type="button" onClick={() => { setShowForm(false); setEditRow(null); }} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
