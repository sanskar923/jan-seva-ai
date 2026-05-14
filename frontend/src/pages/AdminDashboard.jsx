import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import http from "../api/http.js";
import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import { useToast } from "../state/ToastContext.jsx";
import ComplaintList from "../components/ComplaintList.jsx";
import AdminCharts from "../components/AdminCharts.jsx";
import DashboardShell from "../components/DashboardShell.jsx";
import { statusI18nKey } from "../lib/labels.js";

const STATUSES = ["Submitted", "In Progress", "Resolved", "Rejected"];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const toast = useToast();
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (category.trim()) p.set("category", category.trim());
    if (statusFilter.trim()) p.set("status", statusFilter.trim());
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [category, statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const res = await http.get(`/admin/complaints${query}`);
      setComplaints(res.data.complaints || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function setStatus(id, status) {
    setBusyId(id);
    try {
      await http.patch(`/admin/complaints/${id}/status`, { status });
      toast.success(t("admin.statusUpdated"));
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || t("admin.statusError"));
    } finally {
      setBusyId("");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t("list.deleteConfirm"))) return;
    setDeletingId(id);
    try {
      await http.delete(`/complaints/${id}`);
      toast.success(t("list.deleteSuccess"));
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message;
      const st = e?.response?.status;
      if (!e.response) toast.error(t("list.deleteNetwork"));
      else if (st === 404) toast.error(msg || t("list.delete404"));
      else toast.error(msg || t("list.deleteError"));
    } finally {
      setDeletingId("");
    }
  }

  return (
    <DashboardShell title={t("admin.title")} subtitle={t("admin.subtitle")}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <AdminCharts complaints={complaints} />
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card glass className="p-5 lg:col-span-1">
            <div className="text-base font-extrabold">{t("admin.filters")}</div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("admin.filtersHint")}</div>
            <div className="mt-4 space-y-3">
              <Input
                label={t("admin.categoryOptional")}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={t("admin.categoryPlaceholder")}
              />
              <label className="block">
                <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{t("admin.statusOptional")}</div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="">{t("admin.statusPlaceholder")}</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`status.${statusI18nKey(s)}`, { defaultValue: s })}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setCategory("");
                  setStatusFilter("");
                }}
              >
                {t("admin.clear")}
              </Button>
              <Button onClick={load}>{t("admin.refresh")}</Button>
            </div>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            {loading ? (
              <Card glass className="p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  {t("admin.loading")}
                </div>
              </Card>
            ) : (
              <ComplaintList
                title={t("list.allComplaints")}
                complaints={complaints}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            )}

            <Card glass className="p-5">
              <div className="text-sm font-extrabold">{t("admin.updateStatus")}</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("admin.updateHint")}</div>
              <div className="mt-4 space-y-3">
                {complaints.length === 0 ? (
                  <div className="text-sm text-slate-600 dark:text-slate-300">{t("admin.noneToUpdate")}</div>
                ) : (
                  complaints.slice(0, 6).map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white/50 p-3 dark:border-slate-800 dark:bg-slate-950/35"
                    >
                      <div className="min-w-[180px]">
                        <div className="text-sm font-bold">
                          {t(`categories.${c.category}`, { defaultValue: c.category })}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {c.ticketId ? `${c.ticketId} · ` : ""}
                          {c.username}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {STATUSES.map((s) => (
                          <Button
                            key={s}
                            variant={s === "Rejected" ? "danger" : "secondary"}
                            disabled={busyId === c.id}
                            onClick={() => setStatus(c.id, s)}
                          >
                            {t(`status.${statusI18nKey(s)}`, { defaultValue: s })}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
