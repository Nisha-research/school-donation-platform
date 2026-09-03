import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_EMAIL = "admin@schoolcare.org";
const ADMIN_PASSWORD = "schoolcare2026";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const method = req.method;

    if (method === "GET") {
      return new Response(
        JSON.stringify({
          adminEmail: ADMIN_EMAIL,
          adminPassword: ADMIN_PASSWORD,
          message: "Use these credentials to sign in at the admin login page.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (method === "POST") {
      // Create the admin user if they don't already exist
      const { data: existingList, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        return new Response(
          JSON.stringify({ error: "Unable to check existing users." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const existing = existingList.users.find((u) => u.email === ADMIN_EMAIL);
      let adminUserId: string;

      if (existing) {
        adminUserId = existing.id;
      } else {
        const { data: created, error: createError } = await supabase.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
        });
        if (createError || !created) {
          return new Response(
            JSON.stringify({ error: "Failed to create admin user: " + (createError?.message ?? "unknown") }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        adminUserId = created.user.id;
      }

      // Ensure the admin row exists
      const { error: upsertError } = await supabase
        .from("admins")
        .upsert({ user_id: adminUserId, email: ADMIN_EMAIL }, { onConflict: "user_id" });

      if (upsertError) {
        return new Response(
          JSON.stringify({ error: "Failed to record admin: " + upsertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          adminEmail: ADMIN_EMAIL,
          adminPassword: ADMIN_PASSWORD,
          adminUserId,
          message: "Admin account is ready. You can now sign in.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
