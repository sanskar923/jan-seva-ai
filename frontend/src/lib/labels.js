/** Map API status strings to i18n keys (no spaces in keys). */
export const STATUS_I18N_KEY = {
  Submitted: "submitted",
  "In Progress": "inProgress",
  Resolved: "resolved",
  Rejected: "rejected"
};

export function statusI18nKey(status) {
  return STATUS_I18N_KEY[status] || "submitted";
}
