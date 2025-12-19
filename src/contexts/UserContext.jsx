// Nuevo contexto de usuario para gestionar permisos
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const UserContext = createContext(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe usarse dentro de UserProvider');
  }
  return context;
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userMemberships, setUserMemberships] = useState([]);
  const [managedDepartments, setManagedDepartments] = useState([]);
  const [attendanceManagedDepartments, setAttendanceManagedDepartments] = useState([]);
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
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUserId) => {
    try {
      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*, usuario:usuarios(*)')
        .eq('id', authUserId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        console.warn('Perfil de usuario no encontrado');
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

      setUserMemberships(memberships || []);

      // Departamentos para gestión general (Líder/Sublíder)
      const managed = (memberships || [])
        .filter(m => {
          const r = m.rol_jerarquico?.toLowerCase() || '';
          return r === 'líder' || r === 'lider' || r === 'sublíder' || r === 'sublider';
        })
        .map(m => m.departamento);

      // Departamentos para gestión de asistencia (Líder/Sublíder/Encargado)
      const attendanceManaged = (memberships || [])
        .filter(m => {
          const r = m.rol_jerarquico?.toLowerCase() || '';
          return r === 'líder' || r === 'lider' || r === 'sublíder' || r === 'sublider' ||
            r === 'encargado' || r === 'encargada';
        })
        .map(m => m.departamento);

      setManagedDepartments(managed);
      setAttendanceManagedDepartments(attendanceManaged);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDepartmentLeader = (departmentId) => {
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

  const value = {
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
