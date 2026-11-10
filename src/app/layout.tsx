import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { ToastProvider } from "@/components/Toast";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { LedgerProvider } from "@/state/LedgerProvider";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#edeff2" },
    { media: "(prefers-color-scheme: dark)", color: "#060708" },
  ],
};

export const metadata: Metadata = {
  title: { default: "Northstar", template: "%s | Northstar" },
  description: "Northstar Banking - simulated demo, no real funds.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the inline script below sets data-theme on <html> before React hydrates.
    <html lang="en" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full font-sans">
        <ToastProvider>
          <LedgerProvider>
            <AppShell>{children}</AppShell>
          </LedgerProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
