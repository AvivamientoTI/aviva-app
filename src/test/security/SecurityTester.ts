import { supabase } from '../../services/supabaseClient';

/**
 * SecurityTester - Utilidad para auditoría de seguridad y pentesting.
 * Permite ejecutar pruebas de acceso no autorizado y verificar RLS.
 */
export const SecurityTester = {
    /**
     * Intenta leer todos los datos de una tabla específica.
     * Útil para verificar si RLS está abierto.
     */
    async probeTableAccess(tableName: string) {
        console.log(`[SecurityProbe] Intentando leer tabla: ${tableName}...`);
        const { data, error } = await supabase.from(tableName).select('*').limit(5);
        
        if (error) {
            console.log(`[SecurityProbe] 🛡️ Acceso DENEGADO a ${tableName}: ${error.message}`);
            return { status: 'denied', error };
        }
        
        console.log(`[SecurityProbe] ⚠️ Acceso PERMITIDO a ${tableName} (${data?.length || 0} filas obtenidas)`);
        return { status: 'allowed', count: data?.length || 0, sample: data };
    },

    /**
     * Intenta actualizar un registro que no pertenece al usuario.
     */
    async probeUnauthorizedUpdate(tableName: string, id: any, updateData: any) {
        console.log(`[SecurityProbe] Intentando actualización no autorizada en ${tableName} ID ${id}...`);
        const { error } = await supabase.from(tableName).update(updateData).eq('id', id);
        
        if (error) {
            console.log(`[SecurityProbe] 🛡️ Actualización DENEGADA en ${tableName}: ${error.message}`);
            return { status: 'denied', error };
        }
        
        console.log(`[SecurityProbe] 🔴 ALERTA: Actualización PERMITIDA en ${tableName} para un registro ajeno.`);
        return { status: 'vulnerable' };
    },

    /**
     * Verifica la visibilidad de PII (Datos personales) en la tabla usuarios.
     */
    async auditUserPrivacy() {
        console.log('[SecurityAudit] Verificando visibilidad de datos personales...');
        const { data, error } = await supabase.from('usuarios').select('email_personal, telefono, fecha_nacimiento').limit(5);
        
        if (error) return { status: 'denied', error };

        const exposedFields = data?.some(u => u.email_personal || u.fecha_nacimiento);
        if (exposedFields) {
            console.log('[SecurityAudit] 🔴 ALERTA: Datos privados (Email/Fecha Nac.) están expuestos a lectura global.');
            return { status: 'vulnerable', data };
        }

        console.log('[SecurityAudit] ✅ PII restringida exitosamente.');
        return { status: 'protected' };
    }
};
