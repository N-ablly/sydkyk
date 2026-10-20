/** The Sydkyk mascot as inline SVG for generated images (next/og supports inline <svg>). */
export function OgMascot({ size, body = "#0068f8", eyes = "#ffffff" }: { size: number; body?: string; eyes?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <g transform="rotate(-7 32 32)" fill={body}>
        <rect x="5" y="13" width="54" height="37" rx="18.5" />
        <path d="M12 42 L12 59 L28 47 Z" />
      </g>
      <g transform="rotate(-7 32 32)" fill={eyes}>
        <ellipse cx="24" cy="31.5" rx="3.8" ry="5.6" />
        <ellipse cx="40" cy="31.5" rx="3.8" ry="5.6" />
      </g>
    </svg>
  );
}

export const BRAND_BLUE = "#0068f8";
