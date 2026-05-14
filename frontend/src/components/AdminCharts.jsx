import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from "recharts";
import { statusI18nKey } from "../lib/labels.js";

const CATEGORY_COLORS = {
  Electricity: "#6366f1",
  Water: "#0ea5e9",
  Road: "#f59e0b",
  Sanitation: "#10b981",
  Billing: "#ec4899",
  Health: "#f43f5e",
  Police: "#1e293b",
  Government: "#8b5cf6",
  General: "#64748b"
};

function monthLabel(ym) {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export default function AdminCharts({ complaints }) {
  const { t } = useTranslation();

  const categoryRows = useMemo(() => {
    const map = {};
    for (const c of complaints) {
      const k = c.category || "General";
      map[k] = (map[k] || 0) + 1;
    }
    return Object.keys(map).map((name) => ({
      name: t(`categories.${name}`, { defaultValue: name }),
      key: name,
      value: map[name],
      fill: CATEGORY_COLORS[name] || CATEGORY_COLORS.General
    }));
  }, [complaints, t]);

  const statusRows = useMemo(() => {
    const map = {};
    for (const c of complaints) {
      const k = c.status || "Submitted";
      map[k] = (map[k] || 0) + 1;
    }
    return Object.keys(map).map((status) => ({
      name: t(`status.${statusI18nKey(status)}`, { defaultValue: status }),
      count: map[status]
    }));
  }, [complaints, t]);

  const monthlyRows = useMemo(() => {
    const map = {};
    for (const c of complaints) {
      const d = new Date(c.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[ym] = (map[ym] || 0) + 1;
    }
    return Object.keys(map)
      .sort()
      .map((ym) => ({
        ym,
        label: monthLabel(ym),
        count: map[ym]
      }));
  }, [complaints]);

  if (!complaints.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
        {t("admin.chartEmpty")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/40 bg-white/55 p-4 shadow-soft backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/40">
          <div className="px-2 pb-2 text-sm font-extrabold">{t("admin.byCategory")}</div>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryRows} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} paddingAngle={2}>
                  {categoryRows.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} stroke="rgba(15,23,42,0.06)" />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={28} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-white/40 bg-white/55 p-4 shadow-soft backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/40">
          <div className="px-2 pb-2 text-sm font-extrabold">{t("admin.byStatus")}</div>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={48} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name={t("admin.count")} fill="rgba(79, 70, 229, 0.65)" radius={[10, 10, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/40 bg-white/55 p-4 shadow-soft backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/40">
        <div className="px-2 pb-2 text-sm font-extrabold">{t("admin.monthlyTrend")}</div>
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyRows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" name={t("admin.count")} stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
