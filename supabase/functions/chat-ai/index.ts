import * as Sentry from "https://deno.land/x/sentry/index.mjs";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Sentry
Sentry.init({
  dsn: Deno.env.get("SENTRY_DSN") || "https://eea493c606dd0b918ac3e577f0bb5f67@o4511242478354432.ingest.us.sentry.io/4511242483728384",
  performance: true,
});

// Decodifica el payload del JWT sin verificar la firma (el gateway ya lo verificó con verify_jwt: true)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401, headers: corsHeaders });
    }

    // Verificar que sea un JWT de usuario (tiene sub) — la firma ya fue verificada por el gateway
    const token = authHeader.replace('Bearer ', '');
    const payload = decodeJwtPayload(token);
    if (!payload?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), { status: 401, headers: corsHeaders });
    }

    const { query } = await req.json();
    const apiKey = Deno.env.get('GROQ_API_KEY');

    if (!apiKey) {
      throw new Error("Missing GROQ_API_KEY en los secretos de Supabase.");
    }

    const todayDate = new Date().toISOString().split('T')[0];

    const systemPrompt = `Eres el NLP de una app de gestión de asistencia de ujieres (iglesia).
Debes extraer la intención del usuario y devolver un JSON estricto sin dar explicaciones.
Intenciones válidas: 'attendance_summary', 'top_servers', 'absentees', 'upcoming_events', 'specific_user', 'discipline_alerts', 'unknown'.
También debes extraer la fecha de inicio referida (startDate) en formato YYYY-MM-DD. Si no se especifica explícitamente y pregunta por algo global, asume hace 2 meses. Hoy es ${todayDate}.
Si la intención es 'specific_user' o pregunta por alguien, extrae su nombre en el campo 'nameFragment'.
Formato de respuesta OBLIGATORIO:
{
  "intent": "specific_user",
  "startDate": "2024-01-01",
  "nameFragment": "Juan"
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      }),
    });

    const data = await response.json();

    if (data.error) throw new Error(`Groq error (${response.status}): ${JSON.stringify(data.error)}`);
    if (!data.choices?.[0]?.message?.content) {
      throw new Error(`Groq respuesta inesperada: ${JSON.stringify(data)}`);
    }

    const parsedContent = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify({ data: parsedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("CHAT_AI_ERROR:", error);
    Sentry.captureException(error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
