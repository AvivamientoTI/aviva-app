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
    const [userProfile, setUserProfile] = useState<any | null>(null);
    const [userMemberships, setUserMemberships] = useState<Membership[]>([]);
    const [managedDepartments, setManagedDepartments] = useState<Department[]>([]);
    const [attendanceManagedDepartments, setAttendanceManagedDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Obtener usuario actual de Supabase Auth
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                // If there's an error (like Invalid Refresh Token), clear local session
                console.error('Auth error:', error.message);
                if (error.status === 400 || error.message.includes('Refresh Token')) {
                    supabase.auth.signOut();
                }
                setLoading(false);
                return;
            }
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
                console.log('User has no profile linked');
                setUserProfile(null);
                setLoading(false);
                return;
            }

            setUserProfile(profile);

            // Si el usuario no tiene un perfil de usuario, no se puede continuar
            if (!profile.usuario_id) {
                setLoading(false);
                return;
            }

            // Obtener membresías del usuario
            const { data: memberships, error: membError } = await supabase
                .from('membresias')
                .select('*, departamento:departamentos(*)')
                .eq('usuario_id', profile.usuario_id);

            if (membError) throw membError;

            const typedMemberships: Membership[] = memberships as unknown as Membership[] || [];
            console.log('[UserContext] Setting memberships:', typedMemberships);
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

    const isServidoresAdmin = () => {
        return managedDepartments.some(d => {
            if (d.nombre !== 'Servidores') return false;
            const m = userMemberships.find(m => m.departamento_id === d.id);
            const r = m?.rol_jerarquico?.toLowerCase() || '';
            return ['líder', 'lider', 'sublíder', 'sublider'].includes(r);
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
        isServidoresAdmin,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
