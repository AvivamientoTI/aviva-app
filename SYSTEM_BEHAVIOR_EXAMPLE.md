# Ejemplo de Comportamiento: Sistema de Notificaciones de Cumpleaños

Este documento ilustra cómo funciona el sistema automático que hemos implementado.

## 1. Flujo del Proceso (Diagrama)

```mermaid
sequenceDiagram
    autonumber
    participant Cron as ⏰ Programador (Supabase Cron)
    participant Function as ⚡ Edge Function (check-birthdays)
    participant DB as 🗄️ Base de Datos
    participant Resend as 📧 Servicio Email (Resend)
    participant Lider as 👤 Líder de Servidores

    Note over Cron: Todos los días a las 8:00 AM

    Cron->>Function: Dispara ejecución (POST /check-birthdays)
    activate Function
    
    Function->>DB: 1. ¿Quién cumple años hoy?
    DB-->>Function: Lista: [Juan Pérez, María Gonzalez]

    alt Si NO hay cumpleaños
        Function-->>Cron: Termina (Log: "No birthdays today")
    else Si HAY cumpleaños
        Function->>DB: 2. Buscar Dept "Servidores" y su Líder
        DB-->>Function: Emails: [lider@ejemplo.com]

        Function->>Resend: 3. Enviar correo formateado
        Resend->>Lider: 📩 Entrega Correo
        Resend-->>Function: Confirmación (200 OK)
        Function-->>Cron: Termina con Éxito
    end
    deactivate Function
```

---

## 2. Ejemplo del Correo Recibido

Si hoy cumplieran años **Juan Pérez** y **María González**, el líder recibiría un correo con este aspecto:

> **Asunto:** 🎉 Cumpleaños del día: Juan Pérez, María González
>
> **De:** Ujieres App <onboarding@resend.dev>
>
> **Para:** <lider@ejemplo.com>

### Vista Previa del Contenido

**¡Hoy hay cumpleaños!**

Las siguientes personas celebran su vida hoy:

* **Juan Pérez** (1990-01-03)
* **María González** (1995-01-03)

No olvides saludarlos.

---

## 3. Escenarios Posibles

| Escenario | Resultado |
| :--- | :--- |
| **Hay cumpleaños + Hay líder Servidores** | ✅ Se envía el correo con la lista. |
| **No hay cumpleaños** | ⏸️ El sistema se detiene, escribe en el log "No birthdays today" y no envía nada. |
| **Hay cumpleaños + No hay líder Servidores** | ⚠️ El sistema no encuentra a quién enviar y guarda un error en el log "No leader found for Servidores". |
