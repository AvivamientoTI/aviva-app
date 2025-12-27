import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';

// ---- Interfaces ----
export interface Department {
    id: number;
    nombre: string;
    // Añadir más campos si es necesario según el esquema DB
}

export interface UserProfileData {
    usuario: {
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
    userProfile: any | null; // Idealmente tipar esto mejor con UserProfileData
    userMemberships: Membership[];
    managedDepartments: Department[];
    attendanceManagedDepartments: Department[];
    loading: boolean;
    isDepartmentLeader: (departmentId: number | string) => boolean;
    isServicioGeneralLeader: () => boolean;
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
    const [userProfile, setUserProfile] = useState<any | null>(null);
    const [userMemberships, setUserMemberships] = useState<Membership[]>([]);
    const [managedDepartments, setManagedDepartments] = useState<Department[]>([]);
    const [attendanceManagedDepartments, setAttendanceManagedDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Obtener usuario actual de Supabase Auth
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                fetchUserProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Suscribirse a cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                fetchUserProfile(session.user.id);
            } else {
                setUser(null);
                setUserProfile(null);
                setUserMemberships([]);
                setManagedDepartments([]);
                setAttendanceManagedDepartments([]);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (authUserId: string) => {
        try {
            // Obtener perfil del usuario
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*, usuario:usuarios(*)')
                .eq('id', authUserId)
                .maybeSingle();

            if (profileError) throw profileError;

            if (!profile) {
                // Silenciosamente fallar o manejar error. console.warn eliminado para limpieza
                setLoading(false);
                return;
            }

            setUserProfile(profile);

            // Obtener membresías del usuario
            const { data: memberships, error: membError } = await supabase
                .from('membresias')
                .select('*, departamento:departamentos(*)')
                .eq('usuario_id', profile.usuario_id);

            if (membError) throw membError;

            const typedMemberships: Membership[] = memberships as unknown as Membership[] || [];
            setUserMemberships(typedMemberships);

            // Departamentos para gestión general (Líder/Sublíder)
            const managed = typedMemberships
                .filter(m => {
                    const r = m.rol_jerarquico?.toLowerCase() || '';
                    return r === 'líder' || r === 'lider' || r === 'sublíder' || r === 'sublider';
                })
                .map(m => m.departamento)
                .filter((d): d is Department => !!d);

            // Departamentos para gestión de asistencia (Líder/Sublíder/Encargado)
            const attendanceManaged = typedMemberships
                .filter(m => {
                    const r = m.rol_jerarquico?.toLowerCase() || '';
                    return r === 'líder' || r === 'lider' || r === 'sublíder' || r === 'sublider' ||
                        r === 'encargado' || r === 'encargada';
                })
                .map(m => m.departamento)
                .filter((d): d is Department => !!d);

            setManagedDepartments(managed);
            setAttendanceManagedDepartments(attendanceManaged);
        } catch (error) {
            // Manejar error silenciosamente o reportar a servicio externo
            // console.error('Error fetching user profile:', error); 
        } finally {
            setLoading(false);
        }
    };

    const isDepartmentLeader = (departmentId: number | string) => {
        return managedDepartments.some(d => d.id === Number(departmentId));
    };

    const isServicioGeneralLeader = () => {
        return managedDepartments.some(d => {
            if (d.nombre !== 'Servidores') return false;
            const m = userMemberships.find(m => m.departamento_id === d.id);
            const r = m?.rol_jerarquico?.toLowerCase() || '';
            return r === 'líder' || r === 'lider';
        });
    };

    const value: UserContextType = {
        user,
        userProfile,
        userMemberships,
        managedDepartments,
        attendanceManagedDepartments,
        loading,
        isDepartmentLeader,
        isServicioGeneralLeader,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
