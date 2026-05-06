export const ATTENDANCE_STATES = {
    ASISTIO: 'Asistió',
    AUSENTE: 'Ausente',
    CON_JUSTIFICACION: 'Faltó con Aviso',
    SIN_JUSTIFICACION: 'Faltó sin Aviso'
} as const;

export type AttendanceStateType = typeof ATTENDANCE_STATES[keyof typeof ATTENDANCE_STATES];

export const JUSTIFICATION_TYPES = [
    { value: 'trabajo', label: 'Trabajo' },
    { value: 'salud', label: 'Salud' },
    { value: 'permiso_pastoral', label: 'Permiso Pastoral' },
    { value: 'distancia', label: 'Distancia' },
    { value: 'otro', label: 'Otro' },
] as const;

export type JustificationType = 'trabajo' | 'salud' | 'permiso_pastoral' | 'distancia' | 'otro';
