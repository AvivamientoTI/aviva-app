import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

import type { Database } from '../types/database.types'

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
