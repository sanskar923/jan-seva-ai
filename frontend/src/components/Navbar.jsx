import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../state/AuthContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import Button from "../ui/Button.jsx";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-xl px-3 py-2 text-sm font-semibold transition ${
          isActive
            ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Navbar() {
  const { t } = useTranslation();
  const { isAuthed, user, isAdmin, logout } = useAuth();
  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/75 backdrop-blur dark:border-slate-800 dark:bg-slate-950/65">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            JS
          </div>
          <div>
            <div className="text-sm font-extrabold leading-4">{t("nav.brand")}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{t("nav.portalSubtitle")}</div>
          </div>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavItem to="/">{t("nav.home")}</NavItem>
          {isAuthed ? <NavItem to="/dashboard">{t("nav.dashboard")}</NavItem> : null}
          {isAuthed && isAdmin ? <NavItem to="/admin">{t("nav.admin")}</NavItem> : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {!isAuthed ? (
            <>
              <Link to="/login">
                <Button variant="secondary">{t("nav.login")}</Button>
              </Link>
              <Link to="/signup" className="hidden sm:block">
                <Button>{t("nav.signup")}</Button>
              </Link>
            </>
          ) : (
            <>
              <div className="hidden text-sm font-semibold text-slate-600 dark:text-slate-300 sm:block">
                {user?.username}
              </div>
              <Button variant="secondary" onClick={logout}>
                {t("nav.logout")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
