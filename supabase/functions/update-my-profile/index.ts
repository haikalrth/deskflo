import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface ProfileData {
  nama_lengkap: string;
  npm: string;
  jurusan: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization")! } } });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found.");

    const profileData: ProfileData = await req.json();

    // Update data di tabel 'profiles'
    const { error } = await supabase
      .from("profiles")
      .update({
        nama_lengkap: profileData.nama_lengkap,
        npm: profileData.npm,
        jurusan: profileData.jurusan,
      })
      .eq("id", user.id);

    if (error) throw error;

    return new Response(JSON.stringify({ message: "Profil berhasil diperbarui!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
