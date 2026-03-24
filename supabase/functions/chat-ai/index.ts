const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    const apiKey = Deno.env.get('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY en los secretos de Supabase.");
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      }),
    });

    const data = await response.json();
    
    if (data.error) throw new Error(data.error.message);

    const parsedContent = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify({ data: parsedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
