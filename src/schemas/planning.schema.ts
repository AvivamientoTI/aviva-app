import { z } from 'zod';

export const serviceConfigSchema = z.object({
    tipo_servicio: z.string().min(1, 'El tipo de servicio es requerido'),
    uniforme: z.string().min(1, 'El uniforme es requerido'),
    hora: z
        .string()
        .regex(/^(\d{2}:\d{2})?$/, 'Formato de hora inválido (HH:MM)')
        .optional(),
});

export const planningStepDatesSchema = z.object({
    dates: z
        .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'))
        .min(1, 'Selecciona al menos una fecha'),
});

export const planningStepQuotasSchema = z.object({
    encargado_id: z
        .union([z.number(), z.string()])
        .nullable()
        .refine((v) => v !== null && v !== '', {
            message: 'El encargado es requerido',
        }),
});

export type ServiceConfigValues = z.infer<typeof serviceConfigSchema>;
