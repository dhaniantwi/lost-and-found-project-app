import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@^9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://dhaniantwi.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function makeEightDigitCode(): string {
  let code = "";
  const bytes = new Uint8Array(32);
  while (code.length < 8) {
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte < 250) code += String(byte % 10);
      if (code.length === 8) break;
    }
  }
  return code;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Sign in as an administrator." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !gmailUser || !gmailPassword) {
    return json({ error: "CampusFind email service is not fully configured." }, 503);
  }

  const token = authorization.slice("Bearer ".length);
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Your administrator session is invalid. Sign in again." }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await admin
    .from("profiles").select("role").eq("id", authData.user.id).single();
  if (profileError || profile?.role !== "admin") return json({ error: "Only CampusFind administrators can approve claims." }, 403);

  let body: { claimId?: string; adminNotes?: string; collectionLocation?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid request body." }, 400); }
  const claimId = body.claimId?.trim();
  const adminNotes = body.adminNotes?.trim();
  const collectionLocation = body.collectionLocation?.trim();
  if (!claimId || !adminNotes || !collectionLocation) {
    return json({ error: "Claim, administrator notes and collection location are required." }, 400);
  }

  const { data: claim, error: claimError } = await admin
    .from("claims")
    .select("id, claimant_id, item_id, status")
    .eq("id", claimId)
    .single();
  if (claimError || !claim) return json({ error: "Claim not found." }, 404);
  if (claim.status !== "pending") return json({ error: "This claim has already been reviewed." }, 409);

  const [{ data: claimant, error: claimantError }, { data: item, error: itemError }, { data: authClaimant, error: emailError }] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", claim.claimant_id).single(),
    admin.from("item_reports").select("title").eq("id", claim.item_id).single(),
    admin.auth.admin.getUserById(claim.claimant_id),
  ]);
  const recipient = authClaimant?.user?.email;
  if (claimantError || itemError || emailError || !recipient) {
    return json({ error: "The claimant's registered email or claim details could not be verified." }, 422);
  }

  const code = makeEightDigitCode();
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 48 * 60 * 60 * 1000);
  const { data: updated, error: updateError } = await admin.from("claims").update({
    status: "approved",
    admin_notes: adminNotes,
    collection_location: collectionLocation,
    collection_code: code,
    collection_code_expires_at: expiresAt.toISOString(),
    collection_code_issued_at: issuedAt.toISOString(),
    collection_code_used_at: null,
    collection_code_last4: code.slice(-4),
    reviewed_by: authData.user.id,
    reviewed_at: issuedAt.toISOString(),
  }).eq("id", claimId).eq("status", "pending").select("id").maybeSingle();

  if (updateError || !updated) {
    return json({ error: updateError?.message || "This claim was already reviewed by another administrator." }, 409);
  }

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: gmailPassword.replace(/\s/g, "") },
  });

  try {
    await transport.verify();
    await transport.sendMail({
      from: `CampusFind <${gmailUser}>`,
      to: recipient,
      subject: "CampusFind: Your ownership claim has been approved",
      text: [
        `Hello ${claimant?.full_name || "UCC student"},`,
        "",
        "Your CampusFind ownership claim has been approved.",
        `Item: ${item?.title || "Reported item"}`,
        `Collection point: ${collectionLocation}`,
        `Your 8-digit collection code: ${code}`,
        "This code expires 48 hours after approval.",
        "",
        "Bring your valid University of Cape Coast student ID and present this code to the authorized CampusFind administrator.",
        "Do not share this code with anyone else.",
        "",
        "CampusFind | University of Cape Coast",
      ].join("\n"),
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172033"><h2>Claim approved</h2><p>Hello ${String(claimant?.full_name || "UCC student").replace(/[<>]/g, "")},</p><p>Your CampusFind ownership claim has been approved.</p><p><strong>Item:</strong> ${String(item?.title || "Reported item").replace(/[<>]/g, "")}<br><strong>Collection point:</strong> ${String(collectionLocation).replace(/[<>]/g, "")}</p><div style="background:#f1f5f9;padding:20px;text-align:center;border-radius:12px"><p style="margin:0 0 8px">Your 8-digit collection code</p><strong style="font-size:30px;letter-spacing:5px">${code}</strong></div><p>This code expires 48 hours after approval. Bring your valid University of Cape Coast student ID and present the code to the authorized CampusFind administrator.</p><p>Do not share this code with anyone else.</p><p>CampusFind | University of Cape Coast</p></div>`,
    });
    await admin.from("audit_logs").insert({
      actor_id: authData.user.id,
      action: "CLAIM_APPROVED_EMAIL_SENT",
      target_id: claimId,
      details: "Claim approved and collection instructions emailed to the registered claimant address.",
    });
    return json({ success: true, message: "Claim approved and collection code emailed to the registered student." });
  } catch (mailError) {
    // Fail closed: restore the claim to pending and invalidate the code if SMTP fails.
    await admin.from("claims").update({
      status: "pending",
      admin_notes: null,
      collection_location: null,
      collection_code: null,
      collection_code_expires_at: null,
      collection_code_issued_at: null,
      collection_code_used_at: null,
      collection_code_last4: null,
      reviewed_by: null,
      reviewed_at: null,
    }).eq("id", claimId).eq("status", "approved").eq("collection_code", code);
    console.error("CampusFind approval email failed:", mailError instanceof Error ? mailError.message : "Unknown SMTP error");
    return json({ error: "Email delivery failed. The claim was returned to pending; please try again later." }, 502);
  } finally {
    try { transport.close(); } catch { /* no-op */ }
  }
});
