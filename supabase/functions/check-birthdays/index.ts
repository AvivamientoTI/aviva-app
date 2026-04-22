import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import nodemailer from "npm:nodemailer@6.9.7";
import * as Sentry from "https://deno.land/x/sentry/index.mjs";

// Initialize Sentry
Sentry.init({
    dsn: Deno.env.get("SENTRY_DSN") || "https://eea493c606dd0b918ac3e577f0bb5f67@o4511242478354432.ingest.us.sentry.io/4511242483728384",
    performance: true,
});

// Define Interfaces for Types
interface User {
    id: string;
    nombre: string;
    apellido: string;
    fecha_nacimiento: string | null;
    genero: string | null;
}

const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
    try {
        const authHeader = req.headers.get("Authorization");
        if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
            console.error("No valid Authorization header provided.");
            return new Response(JSON.stringify({ error: "Unauthorized access" }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!GMAIL_APP_PASSWORD) {
            const err = new Error("Missing GMAIL_APP_PASSWORD");
            Sentry.captureException(err);
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        const today = new Date();
        const currentMonth = today.getUTCMonth() + 1;
        const currentDay = today.getUTCDate();

        const { data: birthdayPeople, error: usersError } = await supabase
            .rpc("get_birthdays_today", {
                p_month: currentMonth,
                p_day: currentDay
            })
            .returns<User[]>();

        if (usersError) throw usersError;

        if (!birthdayPeople || birthdayPeople.length === 0) {
            return new Response(JSON.stringify({ message: "No birthdays today" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        const birthdayNames = birthdayPeople.map(
            (u: User) => `${u.nombre} ${u.apellido}`
        ).join(", ");

        const { data: user, error: userError } = await supabase
            .from('usuarios')
            .select('email_personal')
            .eq('username', 'holiber.hall')
            .single();

        if (userError) {
            console.warn("Could not fetch Holiber Hall email from DB, using fallback:", userError.message);
        }

        const emails: string[] = [user?.email_personal || "holiberhall@gmail.com"];

        const htmlList = birthdayPeople
            .map((u: User) => `<li><b>${u.nombre} ${u.apellido}</b> (${u.fecha_nacimiento})</li>`)
            .join("");

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: "geovanniga32@gmail.com",
                pass: GMAIL_APP_PASSWORD,
            },
        });

        const info = await transporter.sendMail({
            from: 'Aviva App <geovanniga32@gmail.com>',
            to: emails,
            subject: `🎉 Cumpleaños del día: ${birthdayNames}`,
            html: `
        <h1>¡Hoy hay cumpleaños!</h1>
        <p>Las siguientes personas celebran su vida hoy:</p>
        <ul>
          ${htmlList}
        </ul>
        <p>No olvides saludarlos.</p>
      `,
        });

        return new Response(JSON.stringify({ message: "Emails sent", data: info }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("Error processing birthdays:", err);
        Sentry.captureException(err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
