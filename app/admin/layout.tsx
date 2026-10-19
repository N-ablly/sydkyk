import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leads admin · Sydkyk",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="wrap admin">{children}</div>;
}
