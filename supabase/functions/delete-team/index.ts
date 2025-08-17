import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { teamId } = await req.json();
    if (!teamId) throw new Error("ID tim diperlukan.");

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // Hapus tim dari tabel teams. Anggota akan terhapus otomatis karena ON DELETE CASCADE
    const { error } = await supabaseAdmin.from("teams").delete().eq("id", teamId);

    if (error) throw error;

    return new Response(JSON.stringify({ message: "Tim berhasil dihapus." }), {
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
