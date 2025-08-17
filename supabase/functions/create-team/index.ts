import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { teamName, memberIds } = await req.json();
    if (!teamName) throw new Error("Nama tim diperlukan.");

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // 1. Buat tim baru dan dapatkan ID-nya
    const { data: teamData, error: teamError } = await supabaseAdmin.from("teams").insert({ nama_tim: teamName }).select("id").single();

    if (teamError) throw teamError;
    const newTeamId = teamData.id;

    // 2. Tambahkan anggota jika ada yang dipilih
    if (memberIds && memberIds.length > 0) {
      const membersToInsert = memberIds.map((userId: string) => ({
        team_id: newTeamId,
        user_id: userId,
      }));
      const { error: memberError } = await supabaseAdmin.from("team_members").insert(membersToInsert);
      if (memberError) throw memberError;
    }

    return new Response(JSON.stringify({ message: "Tim berhasil dibuat." }), {
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
