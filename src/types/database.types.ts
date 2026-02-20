export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      asignaciones: {
        Row: {
          configuracion_dia_id: number | null
          id: number
          posicion_id: number | null
          usuario_id: number | null
        }
        Insert: {
          configuracion_dia_id?: number | null
          id?: number
          posicion_id?: number | null
          usuario_id?: number | null
        }
        Update: {
          configuracion_dia_id?: number | null
          id?: number
          posicion_id?: number | null
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_configuracion_dia_id_fkey"
            columns: ["configuracion_dia_id"]
            isOneToOne: false
            referencedRelation: "configuracion_dia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_posicion_id_fkey"
            columns: ["posicion_id"]
            isOneToOne: false
            referencedRelation: "posiciones_departamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      asistencias: {
        Row: {
          configuracion_dia_id: number
          created_at: string | null
          estado: string
          id: string
          justificacion: string | null
          registrado_por: number | null
          updated_at: string | null
          usuario_id: number
        }
        Insert: {
          configuracion_dia_id: number
          created_at?: string | null
          estado: string
          id?: string
          justificacion?: string | null
          registrado_por?: number | null
          updated_at?: string | null
          usuario_id: number
        }
        Update: {
          configuracion_dia_id?: number
          created_at?: string | null
          estado?: string
          id?: string
          justificacion?: string | null
          registrado_por?: number | null
          updated_at?: string | null
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "asistencias_configuracion_dia_id_fkey"
            columns: ["configuracion_dia_id"]
            isOneToOne: false
            referencedRelation: "configuracion_dia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ausencias: {
        Row: {
          created_at: string | null
          fecha_fin: string | null
          fecha_inicio: string
          id: number
          motivo: string | null
          usuario_id: number | null
        }
        Insert: {
          created_at?: string | null
          fecha_fin?: string | null
          fecha_inicio: string
          id?: number
          motivo?: string | null
          usuario_id?: number | null
        }
        Update: {
          created_at?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: number
          motivo?: string | null
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ausencias_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_dia: {
        Row: {
          color_uniforme: string | null
          cupo_hombres: number | null
          cupo_mujeres: number | null
          encargado_id: number | null
          fecha: string
          id: number
          rol_cabecera_id: number | null
          tipo_servicio: string | null
        }
        Insert: {
          color_uniforme?: string | null
          cupo_hombres?: number | null
          cupo_mujeres?: number | null
          encargado_id?: number | null
          fecha: string
          id?: number
          rol_cabecera_id?: number | null
          tipo_servicio?: string | null
        }
        Update: {
          color_uniforme?: string | null
          cupo_hombres?: number | null
          cupo_mujeres?: number | null
          encargado_id?: number | null
          fecha?: string
          id?: number
          rol_cabecera_id?: number | null
          tipo_servicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_dia_encargado_id_fkey"
            columns: ["encargado_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuracion_dia_rol_cabecera_id_fkey"
            columns: ["rol_cabecera_id"]
            isOneToOne: false
            referencedRelation: "roles_cabecera"
            referencedColumns: ["id"]
          },
        ]
      }
      departamentos: {
        Row: {
          created_at: string | null
          id: number
          nombre: string
          prioridad: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          nombre: string
          prioridad?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          nombre?: string
          prioridad?: number | null
        }
        Relationships: []
      }
      membresias: {
        Row: {
          departamento_id: number | null
          id: number
          rol_jerarquico: string | null
          usuario_id: number | null
        }
        Insert: {
          departamento_id?: number | null
          id?: number
          rol_jerarquico?: string | null
          usuario_id?: number | null
        }
        Update: {
          departamento_id?: number | null
          id?: number
          rol_jerarquico?: string | null
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "membresias_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membresias_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      posiciones_departamento: {
        Row: {
          cantidad_default: number | null
          created_at: string | null
          departamento_id: number | null
          genero_requerido: string | null
          id: number
          nombre: string
          orden: number | null
        }
        Insert: {
          cantidad_default?: number | null
          created_at?: string | null
          departamento_id?: number | null
          genero_requerido?: string | null
          id?: number
          nombre: string
          orden?: number | null
        }
        Update: {
          cantidad_default?: number | null
          created_at?: string | null
          departamento_id?: number | null
          genero_requerido?: string | null
          id?: number
          nombre?: string
          orden?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posiciones_departamento_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      roles_cabecera: {
        Row: {
          anio: number
          created_at: string | null
          departamento_id: number | null
          estado: string | null
          id: number
          mes: number
        }
        Insert: {
          anio: number
          created_at?: string | null
          departamento_id?: number | null
          estado?: string | null
          id?: number
          mes: number
        }
        Update: {
          anio?: number
          created_at?: string | null
          departamento_id?: number | null
          estado?: string | null
          id?: number
          mes?: number
        }
        Relationships: [
          {
            foreignKeyName: "roles_cabecera_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      suspensiones: {
        Row: {
          created_at: string
          created_by: string | null
          fecha_fin: string
          fecha_inicio: string
          id: number
          motivo: string | null
          usuario_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fecha_fin: string
          fecha_inicio: string
          id?: number
          motivo?: string | null
          usuario_id: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: number
          motivo?: string | null
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "suspensiones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          id: string
          usuario_id: number | null
        }
        Insert: {
          created_at?: string | null
          id: string
          usuario_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          apellido: string
          created_at: string | null
          fecha_nacimiento: string
          genero: string | null
          id: number
          nombre: string
          telefono: string | null
        }
        Insert: {
          apellido: string
          created_at?: string | null
          fecha_nacimiento: string
          genero?: string | null
          id?: number
          nombre: string
          telefono?: string | null
        }
        Update: {
          apellido?: string
          created_at?: string | null
          fecha_nacimiento?: string
          genero?: string | null
          id?: number
          nombre?: string
          telefono?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_blocked_users: {
        Args: { p_date: string }
        Returns: {
          usuario_id: number
        }[]
      }
      get_user_departments: {
        Args: never
        Returns: {
          departamento_id: number
        }[]
      }
      is_department_leader: { Args: { dept_id: number }; Returns: boolean }
      is_dept_leader:
        | {
            Args: { target_dept_id: number }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.is_dept_leader(target_dept_id => int8), public.is_dept_leader(target_dept_id => int4). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { target_dept_id: number }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.is_dept_leader(target_dept_id => int8), public.is_dept_leader(target_dept_id => int4). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      is_general_approved: {
        Args: { anio: number; mes: number }
        Returns: boolean
      }
      is_global_admin: { Args: never; Returns: boolean }
      is_servidores_leader: { Args: never; Returns: boolean }
      is_user_admin: { Args: { auth_uid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
