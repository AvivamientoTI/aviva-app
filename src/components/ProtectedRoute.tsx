import type { ReactNode } from 'react';
import { useUser } from '../contexts/UserContext';
import { usePermissions } from '../hooks/usePermissions';
import { FullScreenLoader } from './FullScreenLoader';
import { RestrictedAccess } from './RestrictedAccess';

interface ProtectedRouteProps {
    children: ReactNode;
    requireAdmin?: boolean;
    requireMember?: boolean;
    requireLider?: boolean;
    requireLiderServidores?: boolean;
    requireEncargado?: boolean;
}

/**
 * ProtectedRoute - Centraliza la lógica de seguridad y acceso.
 * Verifica sesión, perfil huérfano y roles jerárquicos.
 */
export function ProtectedRoute({ 
    children, 
    requireAdmin, 
    requireMember = true,
    requireLider,
    requireLiderServidores,
    requireEncargado
}: ProtectedRouteProps) {
    const { loading, userProfile, userMemberships } = useUser();
    const perms = usePermissions();

    // 1. Mostrar loader si estamos cargando datos
    if (loading) {
        return <FullScreenLoader />;
    }

    // 2. Si no hay perfil vinculado (usuario huérfano), restringir acceso
    if (userProfile === null) {
        return <RestrictedAccess type="no-profile" />;
    }

    // 3. Verificación de Administrador Global
    if (requireAdmin && !perms.isSystemAdmin) {
        return <RestrictedAccess />;
    }

    // 4. Verificación de Membresía Básica (Servidores)
    if (requireMember && !perms.isServidoresMember && !perms.isSystemAdmin) {
        return <RestrictedAccess type="no-permissions" memberships={userMemberships} isMember={false} />;
    }

    // 5. Verificaciones de Roles Específicos
    if (requireLider && !perms.isLiderOrSublider && !perms.isSystemAdmin) {
        return <RestrictedAccess />;
    }

    if (requireLiderServidores && !perms.isLiderOrSubliderServidores && !perms.isSystemAdmin) {
        return <RestrictedAccess />;
    }

    if (requireEncargado && !perms.isLiderSubliderEncargadoServidores && !perms.isSystemAdmin) {
        return <RestrictedAccess />;
    }

    // Todo correcto: Renderizar hijos
    return <>{children}</>;
}
