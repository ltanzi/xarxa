import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "xarxa",
  description: "Volunteer service exchange.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";

  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col bg-bg text-fg">
        <Providers initialLocale={locale}>
          <Navbar />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
