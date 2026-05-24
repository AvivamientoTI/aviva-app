import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import nodemailer from "npm:nodemailer@6.9.7";

const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");
const GMAIL_SENDER_EMAIL = Deno.env.get("GMAIL_SENDER_EMAIL");
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM");
const FUNCTION_SECRET = Deno.env.get("FUNCTION_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
}

const JUSTIFICATION_LABELS: Record<string, string> = {
    trabajo: "Trabajo",
    salud: "Salud",
    estudio: "Estudio",
    permiso_pastoral: "Permiso Pastoral",
    distancia: "Distancia",
    otro: "Otro",
};

Deno.serve(async (req: Request) => {
    try {
        const authHeader = req.headers.get("Authorization") ?? "";
        const expectedToken = FUNCTION_SECRET
            ? `Bearer ${FUNCTION_SECRET}`
            : `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;

        if (!safeEqual(authHeader, expectedToken)) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!GMAIL_APP_PASSWORD || !GMAIL_SENDER_EMAIL) {
            return new Response(JSON.stringify({ error: "Missing email credentials" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        const { configuracion_dia_id } = await req.json();
        if (!configuracion_dia_id) {
            return new Response(JSON.stringify({ error: "configuracion_dia_id is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Fetch service day info
        const { data: serviceDayData, error: dayError } = await supabase
            .from("configuracion_dia")
            .select("fecha, tipo_servicio")
            .eq("id", configuracion_dia_id)
            .single();

        if (dayError || !serviceDayData) {
            throw new Error(`No se encontró el día de servicio: ${dayError?.message}`);
        }

        const fecha = new Date(serviceDayData.fecha + "T12:00:00").toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const tipoServicio = serviceDayData.tipo_servicio ?? "Servicio";

        // Fetch attendance records with user email
        const { data: records, error: recError } = await supabase
            .from("asistencias")
            .select(`
                estado,
                tipo_justificacion,
                justificacion,
                hora_registro,
                usuarios!inner (
                    nombre,
                    apellido,
                    email_personal,
                    telefono
                )
            `)
            .eq("configuracion_dia_id", configuracion_dia_id);

        if (recError) throw recError;
        if (!records || records.length === 0) {
            return new Response(JSON.stringify({ message: "No hay registros de asistencia" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: GMAIL_SENDER_EMAIL,
                pass: GMAIL_APP_PASSWORD,
            },
        });

        let sent = 0;
        let skipped = 0;

        for (const rec of records) {
            const usuario = Array.isArray(rec.usuarios) ? rec.usuarios[0] : rec.usuarios;
            const nombre = `${usuario.nombre} ${usuario.apellido}`;
            const estado = rec.estado ?? "";

            let subject = "";
            let html = "";
            let whatsappMsg = "";

            if (estado === "Asistió") {
                subject = `✅ Asistencia confirmada — ${tipoServicio}`;
                html = buildEmailHtml(nombre, fecha, tipoServicio, `
                    <p>Tu asistencia al servicio del <strong>${fecha}</strong> ha sido registrada correctamente.</p>
                    <p style="font-size:2rem;text-align:center;">✅</p>
                    <p>¡Gracias por tu servicio!</p>
                `);
                whatsappMsg = `✅ *Aviva App — Asistencia confirmada*\n\nHola ${nombre}, tu asistencia al *${tipoServicio}* del ${fecha} ha sido registrada. ¡Gracias por tu servicio!`;
            } else if (estado === "Faltó sin Aviso") {
                subject = `⚠️ Ausencia registrada — ${tipoServicio}`;
                html = buildEmailHtml(nombre, fecha, tipoServicio, `
                    <p>Se ha registrado tu <strong>ausencia</strong> en el <strong>${tipoServicio}</strong> del ${fecha}.</p>
                    <p style="font-size:2rem;text-align:center;">⚠️</p>
                    <p>Por favor enviar justificación con tus líderes inmediatos. Tienes hasta las <strong>12:00 de la noche</strong> de hoy para justificar tu ausencia.</p>
                `);
                whatsappMsg = `⚠️ *Aviva App — Ausencia registrada*\n\nSe ha registrado tu ausencia en el *${tipoServicio}* del ${fecha}. Por favor enviar justificación con tus líderes inmediatos, tienes hasta las *12:00 de la noche* de hoy para justificar tu ausencia.`;
            } else if (estado === "Faltó con Aviso") {
                const tipoLabel = rec.tipo_justificacion
                    ? JUSTIFICATION_LABELS[rec.tipo_justificacion] ?? rec.tipo_justificacion
                    : "No especificada";
                const detalle = rec.justificacion ? `<p><em>Detalle: ${rec.justificacion}</em></p>` : "";
                subject = `📋 Justificación registrada — ${tipoServicio}`;
                html = buildEmailHtml(nombre, fecha, tipoServicio, `
                    <p>Tu ausencia justificada en el servicio del <strong>${fecha}</strong> ha sido registrada.</p>
                    <p style="font-size:2rem;text-align:center;">📋</p>
                    <p><strong>Motivo:</strong> ${tipoLabel}</p>
                    ${detalle}
                    <p>Tu ausencia no contará negativamente en tus estadísticas.</p>
                `);
                whatsappMsg = `📋 *Aviva App — Justificación registrada*\n\nHola ${nombre}, tu ausencia justificada en el *${tipoServicio}* del ${fecha} ha sido registrada.\n\n*Motivo:* ${tipoLabel}${rec.justificacion ? `\n_${rec.justificacion}_` : ""}\n\nTu ausencia no contará negativamente en tus estadísticas.`;
            } else {
                skipped++;
                continue;
            }

            // Enviar correo si tiene email
            if (usuario?.email_personal) {
                await transporter.sendMail({
                    from: `Aviva App <${GMAIL_SENDER_EMAIL}>`,
                    to: usuario.email_personal,
                    subject,
                    html,
                });
                sent++;
            }

            // Enviar WhatsApp si tiene teléfono y Twilio está configurado
            if (usuario?.telefono && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM) {
                const to = `whatsapp:+${usuario.telefono.replace(/\D/g, "")}`;
                await sendWhatsApp(to, whatsappMsg);
            }

            if (!usuario?.email_personal && !usuario?.telefono) skipped++;
        }

        return new Response(JSON.stringify({ message: "Notificaciones enviadas", sent, skipped }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("Error en notify-attendance:", err);
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});

async function sendWhatsApp(to: string, body: string): Promise<void> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const params = new URLSearchParams({
        From: TWILIO_WHATSAPP_FROM!,
        To: to,
        Body: body,
    });
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        },
        body: params.toString(),
    });
    if (!res.ok) {
        const err = await res.text();
        console.error(`WhatsApp error (${to}):`, err);
    }
}

function buildEmailHtml(nombre: string, fecha: string, tipoServicio: string, body: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 28px 32px; }
    .header h1 { color: #d4af37; margin: 0; font-size: 1.4rem; letter-spacing: -0.02em; }
    .header p { color: #aaa; margin: 4px 0 0; font-size: 0.85rem; }
    .body { padding: 28px 32px; color: #333; line-height: 1.6; }
    .body p { margin: 0 0 12px; }
    .footer { background: #f9f9f9; padding: 16px 32px; color: #999; font-size: 0.78rem; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Aviva App — Control de Asistencia</h1>
      <p>${tipoServicio} · ${fecha}</p>
    </div>
    <div class="body">
      <p>Hola, <strong>${nombre}</strong>.</p>
      ${body}
    </div>
    <div class="footer">Este es un mensaje automático de Aviva App. Por favor no respondas a este correo.</div>
  </div>
</body>
</html>`;
}
