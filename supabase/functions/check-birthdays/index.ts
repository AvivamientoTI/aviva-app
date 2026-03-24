import { createClient } from "npm:@supabase/supabase-js@2.39.0";

import nodemailer from "npm:nodemailer@6.9.7";

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

Deno.serve(async (_req: Request) => {
    try {
        if (!GMAIL_APP_PASSWORD) {
            console.error("Missing GMAIL_APP_PASSWORD");
            return new Response(JSON.stringify({ error: "Configuration Error: Missing GMAIL_APP_PASSWORD" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 1. Get today's date info
        const today = new Date();
        // Adjustment for timezone as needed (simplifying to server time matching logic here)
        const currentMonth = today.getUTCMonth() + 1; // 0-indexed
        const currentDay = today.getUTCDate();

        console.log(`Checking birthdays for: ${currentMonth}-${currentDay} (UTC)`);

        // 2. Fetch all users
        const { data: users, error: usersError } = await supabase
            .from("usuarios")
            .select("id, nombre, apellido, fecha_nacimiento, genero")
            .returns<User[]>();

        if (usersError) throw usersError;

        // Filter for today's birthday
        const birthdayPeople = users.filter((user: User) => {
            if (!user.fecha_nacimiento) return false;
            const bdate = new Date(user.fecha_nacimiento);
            return (
                bdate.getUTCMonth() + 1 === currentMonth &&
                bdate.getUTCDate() === currentDay
            );
        });

        if (birthdayPeople.length === 0) {
            console.log("No birthdays today.");
            return new Response(JSON.stringify({ message: "No birthdays today" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 3. Info of birthday people
        const birthdayNames = birthdayPeople.map(
            (u: User) => `${u.nombre} ${u.apellido}`
        ).join(", ");

        console.log(`Found birthdays: ${birthdayNames}`);

        // Force recipient to the specified email instead of querying app users
        const emails: string[] = ["holiberhall@gmail.com"];

        // 5. Send Email
        // Construct HTML
        const htmlList = birthdayPeople
            .map((u: User) => `<li><b>${u.nombre} ${u.apellido}</b> (${u.fecha_nacimiento})</li>`)
            .join("");

        console.log(`Sending email to ${emails.length} receivers: ${emails.join(", ")}`);

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // Use STARTTLS
            auth: {
                user: "geovanniga32@gmail.com",
                pass: GMAIL_APP_PASSWORD,
            },
        });

        console.log("Attempting to send mail via smtp.gmail.com:587...");


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

        console.log("Email sent successfully. Message ID:", info.messageId);

        return new Response(JSON.stringify({ message: "Emails sent", data: info }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("Error processing birthdays:", err);
        return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
