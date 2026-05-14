import React from "react";
import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "../state/AuthContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import Button from "../ui/Button.jsx";

function SideLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
          isActive
            ? "bg-gradient-to-r from-indigo-600/15 to-fuchsia-600/15 text-slate-900 ring-1 ring-indigo-500/20 dark:text-white"
            : "text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-800/70"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function DashboardShell({ title, subtitle, children }) {
  const { t } = useTranslation();
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="min-h-[calc(100vh-0px)] bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8">
        <motion.aside
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="sticky top-24 hidden h-[calc(100vh-7rem)] w-64 shrink-0 flex-col rounded-3xl border border-white/40 bg-white/55 p-4 shadow-soft backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/45 lg:flex"
        >
          <div className="flex items-center gap-3 px-1">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-sm font-black text-white shadow-lg shadow-indigo-500/25">
              JS
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold">{t("nav.brand")}</div>
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.username}</div>
            </div>
          </div>

          <div className="mt-6 space-y-1">
            <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("shell.workspace")}</div>
            <SideLink to="/dashboard">{t("shell.submitTrack")}</SideLink>
            {isAdmin ? <SideLink to="/admin">{t("shell.adminAnalytics")}</SideLink> : null}
            <Link
              to="/"
              className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-800/70"
            >
              {t("shell.landing")}
            </Link>
          </div>

          <div className="mt-auto space-y-3 border-t border-slate-200/70 pt-4 dark:border-slate-800/70">
            <LanguageSwitcher className="flex-col items-stretch gap-1 px-1" />
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("shell.theme")}</span>
              <ThemeToggle />
            </div>
            <Button variant="secondary" className="w-full" onClick={logout}>
              {t("nav.logout")}
            </Button>
          </div>
        </motion.aside>

        <div className="min-w-0 flex-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-3xl border border-white/40 bg-white/55 p-6 shadow-soft backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/40 lg:hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold">{t("shell.mobileTitle")}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{user?.username}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
                <Button variant="secondary" onClick={logout}>
                  {t("nav.logout")}
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `rounded-2xl px-3 py-2 text-xs font-bold ${
                    isActive ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800"
                  }`
                }
              >
                {t("nav.dashboard")}
              </NavLink>
              {isAdmin ? (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `rounded-2xl px-3 py-2 text-xs font-bold ${
                      isActive ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800"
                    }`
                  }
                >
                  {t("nav.admin")}
                </NavLink>
              ) : null}
            </div>
          </motion.div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
              {t("dashboard.sectionLabel")}
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{subtitle}</p> : null}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
