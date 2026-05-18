import { createClient } from "npm:@supabase/supabase-js@2.28.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// Admin client con Service Role Key (bypasses RLS, puede crear usuarios en Auth)
const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Solo aceptar POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // ── 1. Verificar que el llamante está autenticado ──────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: authError } = await sbAdmin.auth.getUser(token);

    if (authError || !callerUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. Verificar que el llamante es admin ─────────────────────────────
    // Buscar en user_profiles → usuarios → membresias para verificar rol Admin
    // en el departamento "Administración" (misma lógica que is_admin() SQL helper)
    const { data: callerProfile } = await sbAdmin
      .from("user_profiles")
      .select("usuario_id")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (!callerProfile?.usuario_id) {
      return new Response(JSON.stringify({ error: "Forbidden: no profile linked" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminMembership } = await sbAdmin
      .from("membresias")
      .select("id, rol_jerarquico, departamento:departamentos(nombre)")
      .eq("usuario_id", callerProfile.usuario_id);

    const isAdmin = (adminMembership || []).some((m: any) => {
      const rol = (m.rol_jerarquico || "").toLowerCase();
      const deptName = m.departamento?.nombre || "";
      return deptName === "Administración" &&
        ["admin", "superadmin", "administrador", "super admin", "líder", "lider"].some(r => rol.includes(r));
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: only admins can create users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 3. Parsear y validar el body ──────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const { usuario_id, username, password } = body;

    if (!usuario_id || !username || !password) {
      return new Response(JSON.stringify({ error: "Missing required fields: usuario_id, username, password" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 4. Construir email virtual (misma estrategia que Login.jsx) ───────
    const virtualEmail = `${username.toLowerCase().trim()}@ayp.com`;

    // ── 5. Crear el usuario en Supabase Auth ──────────────────────────────
    const { data: authData, error: createError } = await sbAdmin.auth.admin.createUser({
      email: virtualEmail,
      password: password,
      email_confirm: true, // Auto-confirmar para login inmediato
      user_metadata: {
        usuario_id: usuario_id,
        username: username,
      },
    });

    if (createError) {
      console.error("❌ Error creating auth user:", createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authUid = authData.user?.id;

    // ── 6. Crear el registro de vinculación en user_profiles ──────────────
    // user_profiles.id = auth UUID, user_profiles.usuario_id = integer FK
    if (authUid) {
      const { error: profileError } = await sbAdmin
        .from("user_profiles")
        .insert({
          id: authUid,
          usuario_id: usuario_id,
        });

      if (profileError) {
        console.error("⚠️ Auth user created but failed to create user_profile:", profileError);
        // No retornamos error fatal porque el usuario Auth se creó exitosamente.
        // Un admin puede vincular manualmente después si es necesario.
      }
    }

    console.log(`✅ Auth user created for ${username} (usuario_id: ${usuario_id}, auth_uid: ${authUid})`);

    return new Response(
      JSON.stringify({
        success: true,
        auth_uid: authUid,
        message: "User auth created and linked successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("❌ Handler error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
