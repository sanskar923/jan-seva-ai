export function getApiOrigin() {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const trimmed = String(base).replace(/\/+$/, "");
  if (trimmed.endsWith("/api")) return trimmed.slice(0, -4) || "http://localhost:5000";
  return trimmed;
}

export function uploadsUrl(pathname) {
  if (!pathname) return "";
  const origin = getApiOrigin();
  return `${origin}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
