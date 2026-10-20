import type { Metadata, Viewport } from "next";
// Self-hosted variable fonts (Fontsource, OFL-1.1). Builds never download from Google Fonts, which
// fails in cache-less Turbopack builds on Vercel; per-subset unicode-ranges keep ₱ in the brand face.
import "@fontsource-variable/manrope";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { BASE_PATH } from "@/lib/base-path";

const OG_IMAGE = { url: `${BASE_PATH}/brand/og-image`, width: 1200, height: 630, alt: "Sydkyk Enterprise Demo: an AI teammate for HR, IT, Finance and Workplace requests" };

export const metadata: Metadata = {
  metadataBase: new URL("https://www.sydkyk.ai"),
  applicationName: "Sydkyk",
  title: "Sydkyk Enterprise Demo",
  description:
    "Guided Sydkyk demo: an AI teammate handling HR, IT, Finance and Workplace requests for a fictional company, with approvals, handoffs and cited policies.",
  openGraph: {
    type: "website",
    siteName: "Sydkyk",
    title: "Sydkyk Enterprise Demo",
    description: "See an AI teammate handle HR, IT, Finance and Workplace requests, with people in control.",
    url: BASE_PATH,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", title: "Sydkyk Enterprise Demo", images: [OG_IMAGE] },
  // Listed explicitly: setting `icons` here replaces the automatic tag from app/icon.svg.
  icons: {
    icon: { url: `${BASE_PATH}/icon.svg`, type: "image/svg+xml" },
    apple: { url: `${BASE_PATH}/brand/apple-icon`, sizes: "180x180", type: "image/png" },
  },
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
