export const ATTENDANCE_STATES = {
    ASISTIO: 'Asistió',
    AUSENTE: 'Ausente',
    CON_JUSTIFICACION: 'Faltó con Aviso',
    SIN_JUSTIFICACION: 'Faltó sin Aviso'
} as const;

export type AttendanceStateType = typeof ATTENDANCE_STATES[keyof typeof ATTENDANCE_STATES];
