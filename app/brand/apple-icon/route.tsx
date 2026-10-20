import { ImageResponse } from "next/og";
import { BRAND_BLUE, OgMascot } from "@/components/brand/og-mascot";

const size = { width: 180, height: 180 };

/** Home-screen and link-preview icon: white mascot on brand blue. Route-served for the same base-path reason. */
export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND_BLUE }}>
        <OgMascot size={132} body="#ffffff" eyes={BRAND_BLUE} />
      </div>
    ),
    size,
  );
}
