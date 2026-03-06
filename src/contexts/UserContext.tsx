import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// ---- Interfaces ----
export interface Department {
    id: number;
    nombre: string;
    // Añadir más campos si es necesario según el esquema DB
}

export interface UserProfileData {
    id: string;
    usuario_id: number | null;
    usuario?: {
        nombre: string;
        apellido: string;
        // otros campos de usuario
    };
    // otros campos de user_profiles
}

export interface Membership {
    id: number;
    usuario_id: number;
    departamento_id: number;
    rol_jerarquico?: string;
    departamento?: Department;
    // otros campos
}

interface UserContextType {
    user: User | null;
    userProfile: UserProfileData | null;
    userMemberships: Membership[];
    managedDepartments: Department[];
    attendanceManagedDepartments: Department[];
    loading: boolean;
    isDepartmentLeader: (departmentId: number | string) => boolean;
    isServidoresAdmin: () => boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser debe usarse dentro de UserProvider');
    }
    return context;
};

interface UserProviderProps {
    children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const queryClient = useQueryClient();

    useEffect(() => {
        // Obtener usuario actual de Supabase Auth
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error('Auth error:', error.message);
                if (error.status === 400 || error.message.includes('Refresh Token')) {
                    supabase.auth.signOut();
                }
            } else if (session?.user) {
                setUser(session.user);
            }
            setAuthLoading(false);
        });

        // Suscribirse a cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
            } else {
                setUser(null);
                queryClient.cancelQueries({ queryKey: ['userProfileData'] });
                queryClient.removeQueries({ queryKey: ['userProfileData'] });
            }
            setAuthLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [queryClient]);

    // Data fetching centralizado con React Query
    const { data: profileData, isLoading: queryLoading } = useQuery({
        queryKey: ['userProfileData', user?.id],
        queryFn: async () => {
            if (!user) return null;

            // Obtener perfil del usuario
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*, usuario:usuarios(*)')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError) throw profileError;

            // Si no hay perfil o usuario vinculado, retornar vacío
            if (!profile || !profile.usuario_id) {
                return { 
                    profile: (profile as UserProfileData) || null, 
                    memberships: [], 
                    managed: [], 
                    attendanceManaged: [] 
                };
            }

            // Obtener membresías del usuario
            const { data: membershipsData, error: membError } = await supabase
                .from('membresias')
                .select('*, departamento:departamentos(*)')
                .eq('usuario_id', profile.usuario_id);

            if (membError) throw membError;

            // Type assertion seguro una vez mapeado
            const memberships: Membership[] = (membershipsData as any[]) || [];

            // Departamentos para gestión general (Líder/Sublíder)
            const managed = memberships
                .filter(m => {
                    const r = m.rol_jerarquico?.toLowerCase() || '';
                    return r === 'líder' || r === 'lider' || r === 'sublíder' || r === 'sublider';
                })
                .map(m => m.departamento)
                .filter((d): d is Department => !!d);

            // Departamentos para gestión de asistencia (Líder/Sublíder/Encargado)
            const attendanceManaged = memberships
                .filter(m => {
                    const r = m.rol_jerarquico?.toLowerCase() || '';
                    return r === 'líder' || r === 'lider' || r === 'sublíder' || r === 'sublider' ||
                        r === 'encargado' || r === 'encargada';
                })
                .map(m => m.departamento)
                .filter((d): d is Department => !!d);

            return { profile: profile as UserProfileData, memberships, managed, attendanceManaged };
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 15, // Cache de 15 minutos para evitar refetching al navegar
    });

    // Loading general evalúa Auth Loading y Query Loading
    const loading = authLoading || (!!user && queryLoading);

    // Helpers
    const isDepartmentLeader = (departmentId: number | string) => {
        return profileData?.managed.some(d => d.id === Number(departmentId)) ?? false;
    };

    const isServidoresAdmin = () => {
        return profileData?.managed.some(d => {
            if (d.nombre !== 'Servidores') return false;
            const m = profileData.memberships.find(m => m.departamento_id === d.id);
            const r = m?.rol_jerarquico?.toLowerCase() || '';
            return ['líder', 'lider', 'sublíder', 'sublider'].includes(r);
        }) ?? false;
    };

    const value: UserContextType = {
        user,
        userProfile: profileData?.profile ?? null,
        userMemberships: profileData?.memberships ?? [],
        managedDepartments: profileData?.managed ?? [],
        attendanceManagedDepartments: profileData?.attendanceManaged ?? [],
        loading,
        isDepartmentLeader,
        isServidoresAdmin,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
