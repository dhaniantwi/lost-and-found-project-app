import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://dhaniantwi.github.io",
  "http://localhost:3000",
  "http://localhost:5173",
]);

const jsonHeaders = { "Content-Type": "application/json" };

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://dhaniantwi.github.io",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function reply(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), ...jsonHeaders },
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sendCampusFindOtp(email: string, otp: string, resendKey: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "CampusFind <onboarding@resend.dev>",
      to: [email],
      subject: "Your CampusFind verification code",
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a"><h2>Verify your CampusFind access</h2><p>Use this one-time verification code to continue:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:18px 20px;background:#f1f5f9;border-radius:12px;text-align:center">${otp}</div><p>This code expires according to CampusFind's authentication security settings. If you did not request it, you can ignore this email.</p><p style="color:#64748b;font-size:12px">CampusFind · University of Cape Coast</p></div>`,
      text: `Your CampusFind verification code is: ${otp}. If you did not request it, ignore this email.`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Resend delivery failed:", response.status, detail);
    throw new Error("Email delivery is temporarily unavailable. Please try again later.");
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") return reply(req, { error: "Method not allowed." }, 405);

  const origin = req.headers.get("origin") ?? "";
  if (origin && !allowedOrigins.has(origin)) return reply(req, { error: "Origin not allowed." }, 403);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendKey) {
      console.error("CampusFind auth function is missing one or more required secrets.");
      return reply(req, { error: "Authentication service is not fully configured yet." }, 503);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const publicAuth = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const body = await req.json();
    const action = String(body?.action ?? "");
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply(req, { error: "Enter a valid email address." }, 400);
    }

    const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
    const clientIp = forwardedFor.split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "unknown";
    const emailHash = await sha256(email);
    const ipHash = await sha256(clientIp);

    const isVerification = action === "verify-otp";
    if (!["signup", "password-otp", "email-otp", "verify-otp"].includes(action)) {
      return reply(req, { error: "Unsupported authentication action." }, 400);
    }

    const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count: emailCount, error: emailCountError } = await admin
      .from("campusfind_auth_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("email_hash", emailHash)
      .gte("created_at", windowStart);
    if (emailCountError) throw emailCountError;

    const { count: ipCount, error: ipCountError } = await admin
      .from("campusfind_auth_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", windowStart);
    if (ipCountError) throw ipCountError;

    const emailLimit = isVerification ? 8 : 4;
    if ((emailCount ?? 0) >= emailLimit || (ipCount ?? 0) >= 25) {
      return reply(req, { error: "Too many attempts. Please wait 15 minutes and try again." }, 429);
    }

    const { error: logError } = await admin.from("campusfind_auth_rate_limits").insert({
      email_hash: emailHash,
      ip_hash: ipHash,
      action,
    });
    if (logError) throw logError;

    // Keep the rate-limit table bounded without exposing it to client roles.
    await admin.from("campusfind_auth_rate_limits")
      .delete()
      .lt("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (action === "signup") {
      const password = String(body?.password ?? "");
      const fullName = String(body?.fullName ?? "").trim();
      const studentId = String(body?.studentId ?? "").trim();
      const phone = String(body?.phone ?? "").trim();
      const hallOfResidence = String(body?.hallOfResidence ?? "").trim();
      const department = String(body?.department ?? "").trim();

      if (password.length < 8 || !fullName || !studentId || !department) {
        return reply(req, { error: "Complete the required fields and use a password of at least 8 characters." }, 400);
      }

      const { data, error } = await admin.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            student_id: studentId,
            phone,
            hall_of_residence: hallOfResidence,
            department,
          },
        },
      });

      if (error || !data?.properties?.email_otp) {
        console.error("CampusFind signup link generation failed:", error?.message ?? "OTP missing");
        return reply(req, { error: "We could not start registration. Check the email address or try signing in if you already registered." }, 400);
      }

      await sendCampusFindOtp(email, data.properties.email_otp, resendKey);
      return reply(req, { message: "Verification code sent. Enter it to activate your account.", flow: "signup" });
    }

    if (action === "password-otp") {
      const password = String(body?.password ?? "");
      if (!password) return reply(req, { error: "Enter your password." }, 400);

      const { error: passwordError } = await publicAuth.auth.signInWithPassword({ email, password });
      if (passwordError) {
        return reply(req, { error: "Email or password is incorrect." }, 401);
      }

      const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
      if (error || !data?.properties?.email_otp) {
        console.error("CampusFind password OTP generation failed:", error?.message ?? "OTP missing");
        return reply(req, { error: "We could not send a verification code. Please try again." }, 503);
      }

      await sendCampusFindOtp(email, data.properties.email_otp, resendKey);
      return reply(req, { message: "Password accepted. A verification code has been sent to your email.", flow: "magiclink" });
    }

    if (action === "email-otp") {
      const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
      if (error || !data?.properties?.email_otp) {
        // Do not reveal whether an account exists for a passwordless login request.
        console.info("CampusFind passwordless OTP not issued for requested address.");
        return reply(req, { message: "If an active CampusFind account exists for that address, a verification code will arrive shortly.", flow: "magiclink" });
      }

      await sendCampusFindOtp(email, data.properties.email_otp, resendKey);
      return reply(req, { message: "If an active CampusFind account exists for that address, a verification code will arrive shortly.", flow: "magiclink" });
    }

    const token = String(body?.token ?? "").trim();
    const flow = String(body?.flow ?? "");
    if (!/^\d{6,8}$/.test(token) || !["signup", "magiclink"].includes(flow)) {
      return reply(req, { error: "Enter the verification code from your email." }, 400);
    }

    const { data, error } = await admin.auth.verifyOtp({
      email,
      token,
      type: flow as "signup" | "magiclink",
    });

    if (error || !data.session || !data.user) {
      return reply(req, { error: "That code is invalid or has expired. Request a new one and try again." }, 400);
    }

    return reply(req, {
      message: "Email verified. You are now signed in.",
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
      },
      user: { id: data.user.id, email: data.user.email },
    });
  } catch (error) {
    console.error("CampusFind auth error:", error);
    const message = error instanceof Error ? error.message : "Unexpected authentication error.";
    return reply(req, { error: message }, 500);
  }
});
