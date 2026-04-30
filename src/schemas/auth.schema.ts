import { z } from 'zod';

export const loginSchema = z.object({
    username: z
        .string()
        .min(1, 'El nombre de usuario es requerido')
        .max(50, 'El nombre de usuario es demasiado largo')
        .regex(/^[a-zA-Z0-9._-]+$/, 'Solo se permiten letras, números, puntos, guiones y guiones bajos'),
    password: z
        .string()
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
        .max(128, 'La contraseña es demasiado larga'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
