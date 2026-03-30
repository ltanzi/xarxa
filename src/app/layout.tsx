import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { NetworkBackground } from "@/components/layout/NetworkBackground";

export const metadata: Metadata = {
  title: "xarxa",
  description: "Volunteer service exchange.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-bg text-fg">
        <Providers>
          <NetworkBackground />
          <Navbar />
          <main className="flex-1 relative z-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
