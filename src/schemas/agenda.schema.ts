import { z } from 'zod';

export const agendaEventoSchema = z.object({
    titulo: z
        .string()
        .min(3, 'El título debe tener al menos 3 caracteres')
        .max(100, 'El título es demasiado largo'),
    descripcion: z
        .string()
        .max(1000, 'La descripción es demasiado larga')
        .optional(),
    fecha: z
        .string()
        .min(1, 'La fecha es requerida')
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
    hora: z
        .string()
        .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)')
        .optional()
        .or(z.literal('')),
    lugar: z
        .string()
        .max(200, 'El lugar es demasiado largo')
        .optional(),
});

export type AgendaEventoFormValues = z.infer<typeof agendaEventoSchema>;
