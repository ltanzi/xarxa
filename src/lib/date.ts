const DATE_LOCALE = "en-GB";

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString(DATE_LOCALE);
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString(DATE_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
