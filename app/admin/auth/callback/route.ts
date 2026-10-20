import { NextResponse, type NextRequest } from "next/server";
import { siteUrl } from "@/lib/leads/config";
import { authClient } from "@/lib/supabase/server";
import { BASE_PATH } from "@/lib/base-path";

/** Magic-link landing: exchanges the one-time code for a session cookie, then opens the leads page. */
export async function GET(request: NextRequest) {
  // Behind the www.sydkyk.ai proxy, request.url is the deployment host; redirect on the public origin.
  const base = siteUrl() ?? request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await authClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(`${BASE_PATH}/admin/leads`, base));
  }
  return NextResponse.redirect(new URL(`${BASE_PATH}/admin/login?error=link`, base));
}
