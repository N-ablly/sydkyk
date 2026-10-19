"use client";

import { useActionState } from "react";
import { sendAdminLink, type LoginState } from "@/app/admin/actions";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(sendAdminLink, { status: "idle" } as LoginState);
  return (
    <form action={action} className="lead-form" noValidate>
      <label className="f">
        Admin email
        <input name="email" type="email" autoComplete="email" required aria-describedby={state.message ? "login-msg" : undefined} />
      </label>
      {state.message && (
        <p id="login-msg" className={state.status === "error" ? "err" : "okmsg"} role={state.status === "error" ? "alert" : "status"}>
          {state.message}
        </p>
      )}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
