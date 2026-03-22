import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // Determine the external origin from forwarded headers (Render reverse proxy)
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const origin = `${proto}://${host}`;

  const supabase = await createServerClient();

  if (code) {
    // OAuth or PKCE flow
    await supabase.auth.exchangeCodeForSession(code);
  } else if (token_hash && type) {
    // Magic link / OTP flow
    await supabase.auth.verifyOtp({ token_hash, type: type as "magiclink" });
  }

  return NextResponse.redirect(origin);
}
