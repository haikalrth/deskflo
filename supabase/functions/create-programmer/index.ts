import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Definisi tipe untuk data yang masuk
interface NewProgrammerData {
  nama_lengkap: string;
  npm: string;
  jurusan: string;
  email: string;
  role: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Inisialisasi Supabase client
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // Ambil data dari body request
    const { nama_lengkap, npm, jurusan, email, role }: NewProgrammerData = await req.json();

    // Validasi input
    if (!nama_lengkap || !npm || !email || !role) {
      return new Response(JSON.stringify({ error: "Data tidak lengkap. Nama, NPM, email, dan role wajib diisi." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // [FIX] Ubah nilai role menjadi huruf kecil
    const standardizedRole = role.toLowerCase();

    // --- LANGKAH 1: Undang user melalui Supabase Auth ---
    const { data: authData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);

    if (inviteError) {
      if (inviteError.message.toLowerCase().includes("user already registered")) {
        return new Response(JSON.stringify({ error: "Pengguna dengan email ini sudah terdaftar." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 409,
        });
      }
      throw inviteError;
    }

    const newUserId = authData.user.id;

    // --- LANGKAH 2: Buat profil untuk user baru di tabel 'profiles' ---
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: newUserId,
        nama_lengkap,
        npm,
        jurusan,
        email,
        role: standardizedRole, // Gunakan nilai yang sudah distandarisasi
      })
      .select()
      .single();

    if (profileError) {
      if (profileError.code === "23505") {
        await supabase.auth.admin.deleteUser(newUserId);
        return new Response(JSON.stringify({ error: "NPM sudah terdaftar." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 409,
        });
      }
      throw profileError;
    }

    // Kirim respons sukses
    return new Response(JSON.stringify({ message: "Undangan berhasil dikirim dan profil dibuat.", data: profileData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201,
    });
  } catch (err) {
    console.error("General error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
