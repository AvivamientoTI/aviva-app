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
            referencedRelation: "directorio_usuarios"
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
          configuracion_dia_id: number | null
          created_at: string | null
          estado: string | null
          hora_registro: string | null
          id: string
          justificacion: string | null
          tipo_justificacion: 'trabajo' | 'salud' | 'estudio' | 'permiso_pastoral' | 'distancia' | 'otro' | null
          registrado_por: number | null
          updated_at: string | null
          usuario_id: number | null
        }
        Insert: {
          configuracion_dia_id?: number | null
          created_at?: string | null
          estado?: string | null
          hora_registro?: string | null
          id?: string
          justificacion?: string | null
          tipo_justificacion?: 'trabajo' | 'salud' | 'estudio' | 'permiso_pastoral' | 'distancia' | 'otro' | null
          registrado_por?: number | null
          updated_at?: string | null
          usuario_id?: number | null
        }
        Update: {
          configuracion_dia_id?: number | null
          created_at?: string | null
          estado?: string | null
          hora_registro?: string | null
          id?: string
          justificacion?: string | null
          tipo_justificacion?: 'trabajo' | 'salud' | 'estudio' | 'permiso_pastoral' | 'distancia' | 'otro' | null
          registrado_por?: number | null
          updated_at?: string | null
          usuario_id?: number | null
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
            referencedRelation: "directorio_usuarios"
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
            referencedRelation: "directorio_usuarios"
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
      configuracion_dia: {
        Row: {
          color_uniforme: string | null
          cupo_hombres: number | null
          cupo_mujeres: number | null
          encargado_2_id: number | null
          encargado_id: number | null
          fecha: string
          id: number
          rol_cabecera_id: number | null
          service_index: number | null
          tipo_servicio: string | null
          turno: string
        }
        Insert: {
          color_uniforme?: string | null
          cupo_hombres?: number | null
          cupo_mujeres?: number | null
          encargado_2_id?: number | null
          encargado_id?: number | null
          fecha: string
          id?: number
          rol_cabecera_id?: number | null
          service_index?: number | null
          tipo_servicio?: string | null
          turno?: string
        }
        Update: {
          color_uniforme?: string | null
          cupo_hombres?: number | null
          cupo_mujeres?: number | null
          encargado_2_id?: number | null
          encargado_id?: number | null
          fecha?: string
          id?: number
          rol_cabecera_id?: number | null
          service_index?: number | null
          tipo_servicio?: string | null
          turno?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_dia_encargado_2_id_fkey"
            columns: ["encargado_2_id"]
            isOneToOne: false
            referencedRelation: "directorio_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuracion_dia_encargado_2_id_fkey"
            columns: ["encargado_2_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuracion_dia_encargado_id_fkey"
            columns: ["encargado_id"]
            isOneToOne: false
            referencedRelation: "directorio_usuarios"
            referencedColumns: ["id"]
          },
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
          color_hex: string | null
          created_at: string | null
          descripcion: string | null
          id: number
          nombre: string
          prioridad: number | null
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: number
          nombre: string
          prioridad?: number | null
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: number
          nombre?: string
          prioridad?: number | null
        }
        Relationships: []
      }
      horarios_no_disponibilidad: {
        Row: {
          created_at: string
          dia_semana: number
          id: number
          turno: string
          usuario_id: number
        }
        Insert: {
          created_at?: string
          dia_semana: number
          id?: number
          turno: string
          usuario_id: number
        }
        Update: {
          created_at?: string
          dia_semana?: number
          id?: number
          turno?: string
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "horarios_no_disponibilidad_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "directorio_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horarios_no_disponibilidad_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "directorio_usuarios"
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
          created_at: string | null
          created_by: string | null
          fecha_fin: string | null
          fecha_inicio: string
          id: number
          motivo: string | null
          usuario_id: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          fecha_fin?: string | null
          fecha_inicio: string
          id?: number
          motivo?: string | null
          usuario_id?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: number
          motivo?: string | null
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "suspensiones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "directorio_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspensiones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      uniformes_departamento: {
        Row: {
          created_at: string | null
          departamento_id: number | null
          id: number
          nombre: string
        }
        Insert: {
          created_at?: string | null
          departamento_id?: number | null
          id?: number
          nombre: string
        }
        Update: {
          created_at?: string | null
          departamento_id?: number | null
          id?: number
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "uniformes_departamento_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
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
            referencedRelation: "directorio_usuarios"
            referencedColumns: ["id"]
          },
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
          activo: boolean | null
          apellido: string
          created_at: string | null
          email_personal: string | null
          fecha_nacimiento: string | null
          genero: string | null
          id: number
          nombre: string
          telefono: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          activo?: boolean | null
          apellido: string
          created_at?: string | null
          email_personal?: string | null
          fecha_nacimiento?: string | null
          genero?: string | null
          id?: number
          nombre: string
          telefono?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          activo?: boolean | null
          apellido?: string
          created_at?: string | null
          email_personal?: string | null
          fecha_nacimiento?: string | null
          genero?: string | null
          id?: number
          nombre?: string
          telefono?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      directorio_usuarios: {
        Row: {
          activo: boolean | null
          apellido: string | null
          id: number | null
          nombre: string | null
          telefono: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          activo?: boolean | null
          apellido?: string | null
          id?: number | null
          nombre?: string | null
          telefono?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          activo?: boolean | null
          apellido?: string | null
          id?: number | null
          nombre?: string | null
          telefono?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      end_suspension: { Args: { p_suspension_id: number }; Returns: undefined }
      get_annual_attendance_heatmap: {
        Args: { p_dept_id: number; p_start_date: string }
        Returns: {
          asistencias: number
          fecha: string
        }[]
      }
      get_attendance_detailed: {
        Args: { p_config_dia_id: number; p_dept_id: number }
        Returns: {
          apellido: string
          asistencia_id: string
          estado: string
          hora_registro: string
          justificacion: string
          nombre: string
          posicion_nombre: string
          registrado_por: number
          usuario_id: number
        }[]
      }
      get_birthdays_today: {
        Args: { p_day: number; p_month: number }
        Returns: {
          apellido: string
          fecha_nacimiento: string
          genero: string
          id: number
          nombre: string
        }[]
      }
      get_blocked_users: {
        Args: { p_date: string; p_exclude_role_id?: number }
        Returns: {
          usuario_id: number
        }[]
      }
      get_current_month_stats: {
        Args: { p_anio: number; p_mes: number }
        Returns: {
          proximo_servicio: string
          total_asistencias: number
          total_faltas: number
          total_servidores: number
        }[]
      }
      get_demographic_stats: { Args: { p_dept_id?: number }; Returns: Json }
      get_global_attendance_health: {
        Args: { p_start_date: string }
        Returns: {
          active_servers: number
          departamento_id: number
          present: number
          total: number
        }[]
      }
      get_punctuality_stats: {
        Args: { p_dept_id: number; p_limit?: number }
        Returns: Json
      }
      get_user_departments: { Args: never; Returns: number[] }
      is_any_leader_or_admin: { Args: never; Returns: boolean }
      is_dept_leader: { Args: { p_dept_id: number }; Returns: boolean }
      is_dept_leader_for_config: {
        Args: { config_id: number }
        Returns: boolean
      }
      is_global_admin: { Args: never; Returns: boolean }
      is_servidores_leader: { Args: never; Returns: boolean }
      search_users_fuzzy: {
        Args: { p_dept_id: number; p_search_query: string }
        Returns: {
          apellido: string
          id: number
          nombre: string
          score: number
        }[]
      }
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
