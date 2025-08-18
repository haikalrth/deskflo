import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface DeleteRequest {
  programmerId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Inisialisasi Supabase client dengan service_role key
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const { programmerId }: DeleteRequest = await req.json();

    if (!programmerId) {
      return new Response(JSON.stringify({ error: "Programmer ID tidak ditemukan." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // PENTING: Hapus user dari sistem Autentikasi terlebih dahulu.
    // Ini akan otomatis menghapus data terkait di tabel profiles jika Anda
    // telah mengatur 'ON DELETE CASCADE' pada foreign key di tabel profiles.
    // Jika tidak, kita harus menghapusnya secara manual. Kode ini mengasumsikan
    // penghapusan manual untuk keamanan.

    // Langkah 1: Hapus user dari Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(programmerId);

    if (authError) {
      // Jika user tidak ditemukan di Auth (mungkin sudah terhapus),
      // kita tetap bisa melanjutkan untuk menghapus profilnya.
      if (authError.message.toLowerCase().includes("user not found")) {
        console.warn(`User with ID ${programmerId} not found in Auth, proceeding to delete profile.`);
      } else {
        // Untuk error lain, hentikan proses.
        throw authError;
      }
    }

    // Langkah 2: Hapus profil dari tabel 'profiles'
    // Ini akan berjalan bahkan jika user di Auth tidak ditemukan, untuk membersihkan data.
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", programmerId);

    if (profileError) {
      throw profileError;
    }

    return new Response(JSON.stringify({ message: "Programmer berhasil dihapus." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("General error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
