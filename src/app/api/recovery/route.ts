import { NextResponse } from "next/server";
import { z } from "zod";
import { assertOrigin, tokenHash } from "@/lib/security";
import { rateLimit, demoMode } from "@/lib/store";
import {
  requestRecovery,
  consumeRecovery,
  adminCookie,
  mailReady,
} from "@/lib/identity";
import { cookieName } from "@/lib/session";
const schema = z.object({
  action: z.enum(["request", "consume"]),
  email: z.email().max(254).optional(),
  token: z.string().min(32).max(200).optional(),
  purpose: z.enum(["artist", "admin"]).default("artist"),
});
export async function POST(request: Request) {
  try {
    assertOrigin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const text = await request.text();
    if (text.length > 2048) throw Error("Invalid input");
    const input = schema.parse(JSON.parse(text));
    if (input.action === "request") {
      if (!input.email) throw Error("Email is required");
      if (!demoMode && !mailReady())
        return NextResponse.json(
          {
            error:
              "Recovery email is not configured yet. Please retain your current browser session.",
          },
          { status: 503 },
        );
      const network = process.env.VERCEL
        ? request.headers.get("x-vercel-forwarded-for") || "unknown"
        : "local";
      if (!(await rateLimit(tokenHash(`recovery:${network}`))))
        return NextResponse.json(
          { error: "Please wait before requesting another link." },
          { status: 429 },
        );
      try {
        await requestRecovery(input.email, input.purpose);
      } catch {
        console.error("Recovery email delivery failed");
      }
      return NextResponse.json({
        ok: true,
        message:
          "If this address is eligible, a recovery link will be sent. The link expires in 15 minutes.",
      });
    }
    if (!input.token) throw Error("Invalid link");
    const result = await consumeRecovery(input.token, input.purpose);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      input.purpose === "admin" ? adminCookie : cookieName,
      result.token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: result.maxAge,
      },
    );
    return response;
  } catch {
    return NextResponse.json(
      {
        error:
          "This request could not be completed. The link may be invalid, expired, or already used.",
      },
      { status: 400 },
    );
  }
}
