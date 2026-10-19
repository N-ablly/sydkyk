"use client";

import { useEffect, useRef } from "react";
import { formatDate } from "@/lib/demo/format";
import { SOURCES, type SourceId } from "@/lib/demo/sources.generated";

/** Shows the cited policy section: document ID, version, effective date, owner and the section text. */
export function SourceDrawer({ id, onClose }: { id: SourceId | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (id && !d.open) d.showModal();
    if (!id && d.open) d.close();
  }, [id]);

  const s = id ? SOURCES[id] : null;
  return (
    <dialog ref={ref} className="drawer" onClose={onClose} aria-labelledby="src-title">
      {s && (
        <div className="drawer-in">
          <div className="drawer-h">
            <div>
              <p className="sec-l">Policy source</p>
              <h2 id="src-title">
                {s.documentId} · {s.section}
              </h2>
            </div>
            <button className="btn line" type="button" onClick={onClose} autoFocus>
              Close
            </button>
          </div>
          <dl className="kv">
            <dt>Document</dt>
            <dd>{s.title}</dd>
            <dt>Version</dt>
            <dd>{s.version}</dd>
            <dt>Effective</dt>
            <dd>{formatDate(s.effectiveFrom)}</dd>
            <dt>Owner</dt>
            <dd>{s.owner}</dd>
            <dt>Access</dt>
            <dd>{s.classification === "restricted_er" ? "Restricted · assigned Employee Relations reviewers" : "All employees"}</dd>
          </dl>
          <blockquote className="quote">{s.text}</blockquote>
          <p className="meta">Fictional SYDKYK policy written for this demo. Not legal advice.</p>
        </div>
      )}
    </dialog>
  );
}
