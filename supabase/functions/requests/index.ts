import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle preflight requests for CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Buat Supabase client dengan hak akses admin untuk bisa membaca data
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // Ambil data dari tabel 'account_requests'
    const { data, error } = await supabaseAdmin
      .from("account_requests")
      .select("*")
      .eq("status", "pending") // Hanya ambil yang statusnya pending
      .order("requested_at", { ascending: true });

    if (error) {
      throw error;
    }

    // Kembalikan data dalam format JSON
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
