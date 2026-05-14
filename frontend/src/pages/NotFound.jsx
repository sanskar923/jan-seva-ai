import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Card>
        <div className="text-2xl font-black">{t("notFound.title")}</div>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("notFound.body")}</div>
        <div className="mt-5">
          <Link to="/">
            <Button>{t("notFound.home")}</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
