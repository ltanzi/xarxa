const DATE_LOCALE = "en-GB";

function toSafeDate(date: Date | string): Date | null {
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(date: Date | string): string {
  const d = toSafeDate(date);
  return d ? d.toLocaleDateString(DATE_LOCALE) : "";
}

export function formatTime(date: Date | string): string {
  const d = toSafeDate(date);
  return d
    ? d.toLocaleTimeString(DATE_LOCALE, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";
}
