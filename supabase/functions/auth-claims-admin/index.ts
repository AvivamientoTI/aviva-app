import { createClient } from "npm:@supabase/supabase-js@2.28.0";
import { timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HOOK_SECRET = Deno.env.get("HOOK_SECRET");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/**
 * Helper: safe-compare two strings using a timing-safe comparison.
 */
function safeEqual(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  try {
    // 1. Validar secreto del Hook
    if (HOOK_SECRET) {
      const header = req.headers.get("x-supabase-hook-secret") ?? req.headers.get("x-hook-secret");
      
      if (!safeEqual(header, HOOK_SECRET)) {
        console.error("❌ Invalid Hook Secret");
        return new Response(JSON.stringify({ error: "invalid_hook_secret" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json().catch(() => ({}));
    const user_id: string | undefined = body?.user?.id ?? body?.sub ?? body?.user_id;
    
    // IMPORTANTE: Obtener las claims originales del evento para no perderlas
    const originalClaims = body?.claims || {};

    if (!user_id) {
      console.error("❌ No user_id in payload");
      return new Response(JSON.stringify({ error: "no_user_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Llamar a la función RPC en la base de datos
    const { data, error } = await sb.rpc("is_user_admin", { auth_uid: user_id });

    if (error) {
      console.error("❌ RPC error:", error);
      // En caso de error, devolvemos las claims originales sin cambios
      return new Response(JSON.stringify({ claims: originalClaims }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Normalizar respuesta
    const isAdmin = (() => {
      if (data === null || data === undefined) return false;
      if (typeof data === "boolean") return data;
      if (Array.isArray(data) && data.length > 0) return Boolean(data[0]);
      return false;
    })();

    // 4. Construir Claims (Originales + Nuevas)
    const newClaims = { ...originalClaims };
    if (isAdmin) {
      newClaims["is_admin"] = true;
    }

    console.log(`✅ Success. User: ${user_id}, IsAdmin: ${isAdmin}`);

    // 5. Responder a Supabase Auth
    return new Response(JSON.stringify({ claims: newClaims }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("❌ Handler error:", err);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});