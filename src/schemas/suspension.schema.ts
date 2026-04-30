import { z } from 'zod';

export const suspensionSchema = z
    .object({
        usuario_id: z.number({ error: 'El usuario es requerido' }).positive(),
        fecha_inicio: z
            .string()
            .min(1, 'La fecha de inicio es requerida')
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
        fecha_fin: z
            .string()
            .min(1, 'La fecha de fin es requerida')
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
        motivo: z
            .string()
            .min(3, 'El motivo debe tener al menos 3 caracteres')
            .max(500, 'El motivo es demasiado largo'),
    })
    .refine((data) => data.fecha_fin >= data.fecha_inicio, {
        message: 'La fecha de fin debe ser posterior o igual a la fecha de inicio',
        path: ['fecha_fin'],
    });

export type SuspensionFormValues = z.infer<typeof suspensionSchema>;
