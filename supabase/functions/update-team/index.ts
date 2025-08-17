import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { teamId, teamName, memberIds } = await req.json();
    if (!teamId || !teamName) throw new Error("ID dan Nama tim diperlukan.");

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // 1. Update nama tim
    const { error: teamError } = await supabaseAdmin.from("teams").update({ nama_tim: teamName }).eq("id", teamId);
    if (teamError) throw teamError;

    // 2. Hapus semua anggota lama dari tim ini
    const { error: deleteError } = await supabaseAdmin.from("team_members").delete().eq("team_id", teamId);
    if (deleteError) throw deleteError;

    // 3. Tambahkan kembali anggota yang baru dipilih
    if (memberIds && memberIds.length > 0) {
      const membersToInsert = memberIds.map((userId: string) => ({
        team_id: teamId,
        user_id: userId,
      }));
      const { error: insertError } = await supabaseAdmin.from("team_members").insert(membersToInsert);
      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ message: "Tim berhasil diperbarui." }), {
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
