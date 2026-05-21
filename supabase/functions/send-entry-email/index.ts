const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Bagger EZ80 <onboarding@resend.dev>";
const EMAIL_TO = "Bagger.Wartbergnussbach@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY fehlt in den Supabase Secrets." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { entry, submittedBy } = await req.json();

    if (!entry) {
      return new Response(JSON.stringify({ error: "entry fehlt." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const usageType =
      entry.usage_type === "ueberbetrieblich" ? "überbetrieblich" : "innerbetrieblich";

    const subject = `Neuer Bagger EZ80 Eintrag: ${entry.member_name || "Unbekannt"} - ${entry.date || ""}`;

    const text = [
      "Neuer Eintrag für Bagger EZ80",
      "",
      `Erfasst von: ${submittedBy || "Unbekannt"}`,
      `Datum: ${entry.date || ""}`,
      `Mitglied / Fahrer: ${entry.member_name || ""}`,
      `Betriebsstunden: ${entry.hours ?? ""}`,
      `Getankte Dieselmenge: ${entry.diesel_liters ?? 0} Liter`,
      `Einsatzart: ${usageType}`,
      `Bemerkung / Schäden: ${entry.note || "-"}`,
      `Erfasst am: ${entry.created_at || ""}`,
    ].join("\n");

    const html = `
      <h2>Neuer Eintrag für Bagger EZ80</h2>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
        <tr><td><strong>Erfasst von</strong></td><td>${escapeHtml(submittedBy || "Unbekannt")}</td></tr>
        <tr><td><strong>Datum</strong></td><td>${escapeHtml(entry.date)}</td></tr>
        <tr><td><strong>Mitglied / Fahrer</strong></td><td>${escapeHtml(entry.member_name)}</td></tr>
        <tr><td><strong>Betriebsstunden</strong></td><td>${escapeHtml(entry.hours)}</td></tr>
        <tr><td><strong>Getankte Dieselmenge</strong></td><td>${escapeHtml(entry.diesel_liters ?? 0)} Liter</td></tr>
        <tr><td><strong>Einsatzart</strong></td><td>${escapeHtml(usageType)}</td></tr>
        <tr><td><strong>Bemerkung / Schäden</strong></td><td>${escapeHtml(entry.note || "-")}</td></tr>
        <tr><td><strong>Erfasst am</strong></td><td>${escapeHtml(entry.created_at || "")}</td></tr>
      </table>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [EMAIL_TO],
        subject,
        text,
        html,
      }),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      return new Response(JSON.stringify({ error: resendResult }), {
        status: resendResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, result: resendResult }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
