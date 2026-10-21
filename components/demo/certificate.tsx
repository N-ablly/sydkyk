"use client";

import { useEffect, useRef, useState } from "react";
import type { CertificateArtifact } from "@/lib/demo/types";
import { Mascot } from "./chrome";

/**
 * The issued certificate. The document text uses ordinary company wording; the SAMPLE watermark and
 * the footer note come from the demo around it (pack rule: no real signatures, seals or valid documents).
 */
export function CertificateDoc({ cert }: { cert: CertificateArtifact }) {
  return (
    <article className="cert" aria-label={`${cert.title}, reference ${cert.reference}`}>
      <p className="cert-wm" aria-hidden="true">
        SAMPLE · NOT VALID
      </p>
      <header className="cert-head">
        <Mascot small />
        <div>
          <strong>SYDKYK</strong>
          <span>Makati City, Philippines</span>
        </div>
        <dl>
          <dt>Ref.</dt>
          <dd>{cert.reference}</dd>
          <dt>Date</dt>
          <dd>{cert.issuedOn}</dd>
        </dl>
      </header>
      <h3 className="cert-title">{cert.heading}</h3>
      <p className="cert-to">To whom it may concern:</p>
      {cert.body.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <footer className="cert-sign">
        <p>
          <strong>{cert.issuer.name}</strong>
          <span>{cert.issuer.role}</span>
        </p>
        <p className="cert-approved">Approved in Sydkyk · {cert.issuer.approvedOn}</p>
      </footer>
      <p className="cert-note">Fictional demo document. No signature or seal; not valid for any external use.</p>
    </article>
  );
}

/** Chat preview of the certificate; tapping it opens the full-size view. */
export function CertificateCard({ cert }: { cert: CertificateArtifact }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <button type="button" className="cert-card" onClick={() => setOpen(true)} aria-label={`View ${cert.title} full size`}>
        <span className="cert-card-h">
          <strong>{cert.title}</strong>
          <span className="pill ok">Issued</span>
        </span>
        <span className="cert-preview" aria-hidden="true">
          <CertificateDoc cert={cert} />
        </span>
        <span className="cert-card-f">
          <span>
            {cert.reference} · {cert.issuedOn}
          </span>
          <span className="cert-open">View certificate →</span>
        </span>
      </button>
      <dialog ref={dialog} className="drawer cert-dialog" onClose={() => setOpen(false)} aria-label={cert.title}>
        <div className="drawer-in">
          <div className="drawer-h">
            <div>
              <p className="sec-l">Issued document</p>
              <h2>{cert.title}</h2>
            </div>
            <button className="btn line" type="button" onClick={() => setOpen(false)} autoFocus>
              Close
            </button>
          </div>
          <CertificateDoc cert={cert} />
        </div>
      </dialog>
    </>
  );
}
