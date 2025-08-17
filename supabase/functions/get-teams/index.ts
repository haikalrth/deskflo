import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle preflight requests for CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // Ambil data dari tabel 'teams' dan secara otomatis mengambil
    // data anggota yang terhubung dari tabel 'profiles'
    const { data, error } = await supabaseAdmin.from("teams").select(`
        id,
        nama_tim,
        profiles (
          id,
          nama_lengkap,
          avatar_url
        )
      `);

    if (error) {
      throw error;
    }

    // Ubah nama 'profiles' menjadi 'members' agar lebih mudah dibaca di frontend
    const teamsWithMembers = data.map((team) => ({
      ...team,
      members: team.profiles,
    }));

    return new Response(JSON.stringify(teamsWithMembers), {
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
