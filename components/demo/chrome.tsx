import type { Notice } from "@/lib/demo/use-demo";

export function Mascot({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "mascot sm" : "mascot"} aria-hidden="true">
      <i />
      <i />
    </span>
  );
}

export function BotAvatar() {
  return (
    <div className="av bot" aria-hidden="true">
      <Mascot small />
    </div>
  );
}

/** Phone status bar; hidden by CSS outside the mobile channel. */
export function StatusBar({ time }: { time: string }) {
  return (
    <div className="statusbar" aria-hidden="true">
      <span>{time}</span>
      <span>5G · 100%</span>
    </div>
  );
}

/** Phone bottom navigation; hidden by CSS outside the mobile channel. */
export function TabBar({ items }: { items: string[] }) {
  return (
    <nav className="tabbar" aria-hidden="true">
      {items.map((item, i) => (
        <span key={item} className={i === 0 ? "on" : undefined}>
          {item}
        </span>
      ))}
    </nav>
  );
}

/** Push notification banner that slides into the phone frame. */
export function PushNotice({ notice }: { notice?: Notice }) {
  return (
    <div className={notice?.visible ? "notif show" : "notif"} role="status">
      {notice && (
        <>
          <BotAvatar />
          <div>
            <strong>
              Sydkyk<small>now</small>
            </strong>
            {notice.title} · {notice.body}
          </div>
        </>
      )}
    </div>
  );
}

export function SystemsChain({ systems }: { systems: string[] }) {
  return (
    <div className="systems">
      {systems.map((system, i) => (
        <span key={system} style={{ display: "contents" }}>
          <span className="sys">{system}</span>
          {i < systems.length - 1 && <span className="arrow">→</span>}
        </span>
      ))}
    </div>
  );
}
