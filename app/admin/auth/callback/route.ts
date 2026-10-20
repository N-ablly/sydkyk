import { NextResponse, type NextRequest } from "next/server";
import { authClient } from "@/lib/supabase/server";
import { BASE_PATH } from "@/lib/base-path";

/** Magic-link landing: exchanges the one-time code for a session cookie, then opens the leads page. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await authClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(`${BASE_PATH}/admin/leads`, request.url));
  }
  return NextResponse.redirect(new URL(`${BASE_PATH}/admin/login?error=link`, request.url));
}
