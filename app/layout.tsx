import type { Metadata, Viewport } from "next";
// Self-hosted variable fonts (Fontsource, OFL-1.1). Builds never download from Google Fonts, which
// fails in cache-less Turbopack builds on Vercel; per-subset unicode-ranges keep ₱ in the brand face.
import "@fontsource-variable/manrope";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sydkyk Enterprise Demo",
  description:
    "Guided Sydkyk demo: an AI teammate handling HR, IT, Finance and Workplace requests for a fictional company, with approvals, handoffs and cited policies.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#141a26" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
