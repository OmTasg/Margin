import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getUserEmailWithToken } from "@/lib/google/calendar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${appUrl}?settings=true&google_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}?settings=true&google_error=No+code+provided`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const email = tokens.access_token ? await getUserEmailWithToken(tokens.access_token) : null;

    // Build redirect response with secure HTTP-only cookies and a client-side bridge script
    // to populate localStorage settings instantly
    const targetUrl = new URL("/", appUrl);
    targetUrl.searchParams.set("settings", "true");
    targetUrl.searchParams.set("google", "connected");
    if (email) targetUrl.searchParams.set("email", email);

    // Return an HTML page that stores tokens in localStorage and redirects to root
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Connecting Google Calendar...</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #09090b; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #18181b; padding: 2rem; border-radius: 1rem; border: 1px solid #27272a; text-align: center; max-width: 400px; }
    .spinner { border: 3px solid rgba(255,255,255,0.1); border-top-color: #3b82f6; border-radius: 50%; width: 2rem; height: 2rem; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h3>Google Calendar Connected</h3>
    <p style="color: #a1a1aa; font-size: 0.875rem;">Saving credentials and returning to your tasks...</p>
  </div>
  <script>
    try {
      const existing = JSON.parse(localStorage.getItem('todo_pwa_settings_v1') || '{}');
      existing.google_access_token = ${JSON.stringify(tokens.access_token || null)};
      if (${JSON.stringify(tokens.refresh_token || null)}) {
        existing.google_refresh_token = ${JSON.stringify(tokens.refresh_token || null)};
      }
      existing.google_token_expiry = ${JSON.stringify(tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null)};
      existing.google_user_email = ${JSON.stringify(email)};
      localStorage.setItem('todo_pwa_settings_v1', JSON.stringify(existing));
    } catch (e) {
      console.error(e);
    }
    window.location.href = ${JSON.stringify(targetUrl.toString())};
  </script>
</body>
</html>`;

    const res = new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });

    if (tokens.access_token) {
      res.cookies.set("gcal_access_token", tokens.access_token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600, // 1 hour
      });
    }

    if (tokens.refresh_token) {
      res.cookies.set("gcal_refresh_token", tokens.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 3600, // 30 days
      });
    }

    if (email) {
      res.cookies.set("gcal_user_email", email, {
        path: "/",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 3600,
      });
    }

    return res;
  } catch (err: any) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${appUrl}?settings=true&google_error=${encodeURIComponent(err?.message || "OAuth token exchange failed")}`);
  }
}
