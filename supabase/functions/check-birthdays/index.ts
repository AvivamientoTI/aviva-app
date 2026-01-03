import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import { Resend } from "npm:resend@2.0.0";

// Define Interfaces for Types
interface User {
    id: string;
    nombre: string;
    apellido: string;
    fecha_nacimiento: string | null;
    genero: string | null;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const resend = new Resend(RESEND_API_KEY);

Deno.serve(async (_req: Request) => {
    try {
        if (!RESEND_API_KEY) {
            console.error("Missing RESEND_API_KEY");
            return new Response(JSON.stringify({ error: "Configuration Error: Missing RESEND_API_KEY" }), {
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

        // 4. Fetch Leader of "Servidores" department SPECIFICALLY
        // Step A: Find the department ID for "Servidores"
        const { data: deptData, error: deptError } = await supabase
            .from("departamentos")
            .select("id")
            .ilike("nombre", "%Servidores%")
            // Also allowing 'Ujieres' if Servidores is different, but user said "Servidores".
            // We will stick to Servidores.
            .limit(1);

        if (deptError) {
            console.error("Error fetching department:", deptError);
            throw deptError;
        }

        const servidoresDeptId = deptData && deptData.length > 0 ? deptData[0].id : null;

        if (!servidoresDeptId) {
            console.error("Department 'Servidores' not found (searching ilike '%Servidores%')");
            return new Response(JSON.stringify({ error: "Department 'Servidores' not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Step B: Fetch membership for that specific department with role 'Lider'
        const { data: leadersData, error: leadersError } = await supabase
            .from("membresias")
            .select("usuario_id")
            .eq("departamento_id", servidoresDeptId)
            .eq("rol_jerarquico", "Lider");

        if (leadersError) throw leadersError;

        // Get unique leader IDs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const leaderIds = [...new Set(leadersData.map((l: any) => l.usuario_id))];

        if (leaderIds.length === 0) {
            console.log(`No 'Lider' found for Department ID ${servidoresDeptId} (Servidores).`);
            return new Response(JSON.stringify({ message: "No leader found for Servidores" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Fetch emails using Admin Auth API
        const emails: string[] = [];
        for (const uid of leaderIds) {
            if (typeof uid === 'string') {
                const { data: userData, error: userError } = await supabase.auth.admin.getUserById(uid);
                if (!userError && userData.user && userData.user.email) {
                    emails.push(userData.user.email);
                }
            }
        }

        if (emails.length === 0) {
            console.log("No leader emails found.");
            return new Response(JSON.stringify({ message: "No leader emails found" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 5. Send Email
        // Construct HTML
        const htmlList = birthdayPeople
            .map((u: User) => `<li><b>${u.nombre} ${u.apellido}</b> (${u.fecha_nacimiento})</li>`)
            .join("");

        const { data: emailData, error: emailError } = await resend.emails.send({
            from: "Ujieres App <onboarding@resend.dev>", // Or user's domain
            to: emails, // Resend handles array of emails
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

        if (emailError) {
            console.error("Resend Error:", emailError);
            throw emailError;
        }

        return new Response(JSON.stringify({ message: "Emails sent", data: emailData }), {
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
