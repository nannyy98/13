import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Apikey, X-Client-Info",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the SQL function to verify password (handles bcrypt + plain text)
    const { data: result, error } = await supabase.rpc("verify_admin_password", {
      p_email: email.trim().toLowerCase(),
      p_password: password,
    }).maybeSingle();

    if (error || !result?.valid) {
      return new Response(
        JSON.stringify({ error: result?.error || "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate session token
    const sessionToken = crypto.randomUUID();
    const tokenHash = await hashToken(sessionToken);

    // Update session in DB
    await supabase
      .from("admin_accounts")
      .update({
        last_login_at: new Date().toISOString(),
        session_token: tokenHash,
      })
      .eq("id", result.id);

    // Log the login
    await supabase.from("audit_log").insert({
      admin_id: result.id,
      action: "login",
      entity_type: "admin_accounts",
      entity_id: result.id,
      details: { email: result.email },
    });

    return new Response(
      JSON.stringify({
        success: true,
        admin: {
          id: result.id,
          email: result.email,
          first_name: result.first_name,
          role: result.role,
        },
        sessionToken,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin login error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function hashToken(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
