import { ImageResponse } from "next/og";
import { BRAND_BLUE, OgMascot } from "@/components/brand/og-mascot";

const size = { width: 1200, height: 630 };

/**
 * Link-preview card (Slack, iMessage, LinkedIn, Teams). Served from a route rather than the
 * opengraph-image file convention, which omits the /experience base path from its URL.
 */
export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: BRAND_BLUE, color: "#ffffff", padding: "72px 80px", alignItems: "center", gap: 64 }}>
        <div style={{ display: "flex", width: 300, height: 300, borderRadius: 64, background: "#ffffff", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <OgMascot size={230} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 30, letterSpacing: 4, opacity: 0.85 }}>ENTERPRISE DEMO</div>
          <div style={{ fontSize: 104, fontWeight: 800, lineHeight: 1 }}>Sydkyk</div>
          <div style={{ fontSize: 40, lineHeight: 1.25, maxWidth: 640 }}>The AI teammate for HR, IT, Finance and Workplace, with people in control.</div>
          <div style={{ fontSize: 26, opacity: 0.8, marginTop: 10 }}>sydkyk.ai/experience</div>
        </div>
      </div>
    ),
    size,
  );
}
