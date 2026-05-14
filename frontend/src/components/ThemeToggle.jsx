import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../state/ThemeContext.jsx";
import Button from "../ui/Button.jsx";

export default function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  return (
    <Button variant="secondary" onClick={toggle} className="px-3">
      {theme === "dark" ? t("theme.light") : t("theme.dark")}
    </Button>
  );
}
