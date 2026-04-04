import { cookies } from "next/headers";
import en from "./locales/en.json";
import es from "./locales/es.json";
import ca from "./locales/ca.json";

const locales = { en, es, ca };

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

export async function getTranslations() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";
  const translations = locales[locale as keyof typeof locales] || locales.en;
  const t = (key: string) => getNestedValue(translations as unknown as Record<string, unknown>, key);
  return { t, locale };
}
