# Guía de Configuración: Notificaciones de Cumpleaños

Esta guía detalla los pasos para activar el sistema de notificaciones automáticas de cumpleaños en el proyecto Ujieres App.

## Requisitos Previos

1. **Supabase CLI**: Asegúrate de tener instalado y logueado el CLI de Supabase.
2. **Cuenta de Resend**: Necesitarás una API Key de [Resend](https://resend.com/) para el envío de correos.
3. **Proyecto Linkeado**: Tu entorno local debe estar vinculado a tu proyecto de Supabase (`supabase link`).

## Paso 1: Configurar Secretos

La función `check-birthdays` necesita acceder a la API de Resend y a la URL/Key de Supabase (estas últimas suelen inyectarse automáticamente, pero validaremos).

Ejecuta el siguiente comando en tu terminal para establecer la API Key de Resend:

```bash
npx supabase secrets set RESEND_API_KEY=re_123456789
```

*(Reemplaza `re_123456789` con tu API Key real de Resend)*

## Paso 2: Desplegar la Edge Function

Sube la función que verifica los cumpleaños y envía los correos:

```bash
npx supabase functions deploy check-birthdays
```

Toma nota de la URL de despliegue que aparecerá en la consola (ej. `https://<project_ref>.supabase.co/functions/v1/check-birthdays`).

## Paso 3: Configurar el Cron Job (Base de Datos)

Para que la función se ejecute automáticamente todos los días, debemos configurar un trabajo programado (Cron Job) en la base de datos PostgreSQL.

1. Abre el archivo `supabase/SQL_CRON_SETUP.sql`.
2. Reemplaza los valores marcados:
    * `YOUR_SERVICE_ROLE_KEY`: Encuéntrala en el Dashboard de Supabase > Project Settings > API > `service_role secret`.
    * Reemplaza la URL en `net.http_post` con la URL de tu función desplegada (obtenida en el Paso 2).

3. Ejecuta el script SQL en tu base de datos.
    * Ve al **Dashboard de Supabase** -> **SQL Editor**.
    * Crea una "New Query".
    * Copia y pega el contenido de `supabase/SQL_CRON_SETUP.sql`.
    * Haz clic en **Run**.

    > **Nota**: El script está configurado para ejecutarse a las **06:00 UTC**, que corresponde a las **00:00 hora de Costa Rica**.

## Paso 4: Verificación

### Verificar ejecución manual

Puedes probar la función usando el script `supabase/TEST_RUN.sql` en el SQL Editor de Supabase.

### Verificar Logs

Dado que su versión de CLI no tiene el comando `logs`, revise los logs directamente en la web:

1. Vaya al **Dashboard de Supabase** -> **Edge Functions**.
2. Haga clic en la función `check-birthdays`.
3. Vaya a la pestaña **Logs** (o "Invocations").

## Paso 5: Habilitar Envíos a Cualquier Correo (Producción)

Por defecto, Resend te coloca en un modo de "Pruebas" (Testing) que solo permite enviar correos a la dirección con la que te registraste. Para enviar correos a los líderes reales, debes verificar un dominio.

### Opción A: Verificar un Dominio (Recomendado)

1. Ve al [Dashboard de Dominios de Resend](https://resend.com/domains).
2. Haz clic en **Add Domain**.
3. Ingresa tu dominio (ej. `midominio.com` o `app.midominio.com`).
4. Resend te dará unos registros DNS (Type MX, TXT, CNAME).
5. Inicia sesión en tu proveedor de dominio (GoDaddy, Namecheap, Cloudflare, etc.).
6. Agrega los registros DNS proporcionados por Resend.
7. Haz clic en "Verify" en Resend.
8. Una vez verificado (Status: Verified), actualiza el código en `supabase/functions/check-birthdays/index.ts`:

```typescript
// Cambia esto:
from: "Ujieres App <onboarding@resend.dev>"

// Por esto (usando tu dominio verificado):
from: "Ujieres App <notificaciones@midominio.com>"
```

1. Vuelve a desplegar la función: `npx supabase functions deploy check-birthdays`.

### Opción B: Solicitar Acceso de Producción

Si no tiene un dominio propio, *no podrás usar Resend para enviar a terceros* de forma gratuita.

### Opción C: Alternativa Gratuita (Gmail SMTP)

Si prefiere usar su cuenta de Gmail personal para enviar los correos (sin dominio propio), debe cambiar la librería de `Resend` a `Nodemailer`.

**Pasos:**

1. **Seguridad de Google**: Vaya a su cuenta de Google -> Seguridad -> Verificación en 2 pasos (Activar) -> Contraseñas de aplicaciones (App Passwords).
2. **Crear Contraseña**: Genere una nueva contraseña para "Correo" / "Mac" (o personalizado). Copie esa contraseña de 16 caracteres.
3. **Configurar Secreto**:

    ```bash
    npx supabase secrets set GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
    ```

4. **Modificar Código (`index.ts`)**:
    Reemplace la importación y uso de Resend por Nodemailer:

    ```typescript
    import nodemailer from "npm:nodemailer@6.9.7";

    // ... dentro del handler ...
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'tu_correo@gmail.com',
        pass: Deno.env.get("GMAIL_APP_PASSWORD")
      }
    });

    await transporter.sendMail({
      from: 'Ujieres App <tu_correo@gmail.com>',
      to: emails,
      subject: `🎉 Cumpleaños del día: ${birthdayNames}`,
      html: `...`
    });
    ```

5. **Desplegar**: `npx supabase functions deploy check-birthdays`.

## Solución de Problemas Comunes

* **Error 500 "Missing RESEND_API_KEY"**: Asegúrate de haber ejecutado el Paso 1 correctamente.
* **No llegan correos**: Verifica que el dominio de remitente en la función (`onboarding@resend.dev` o tu dominio propio) esté verificado en Resend.
* **"Department 'Servidores' not found"**: La función busca un departamento que contenga "Servidores" en el nombre.
* **Validation Error (403)**: Estás intentando enviar a un correo no autorizado sin haber verificado un dominio (ver Paso 5).
