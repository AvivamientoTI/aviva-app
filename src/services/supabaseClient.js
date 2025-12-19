import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://ndgyicayxjgygijvahbu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZ3lpY2F5eGpneWdpanZhaGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1Nzk2ODgsImV4cCI6MjA4MTE1NTY4OH0.XSamenZ4eNFuEI17sJvxanwwu1BUz4nV0HPBNdrxyDg'
export const supabase = createClient(supabaseUrl, supabaseKey)