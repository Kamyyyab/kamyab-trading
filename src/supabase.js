import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tgzgndyxfwnoqvtbetns.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnemduZHl4Zndub3F2dGJldG5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NzMxMjcsImV4cCI6MjA5MDM0OTEyN30.GCNzqE0otgAdHSEDk_ipfL_g2_tmyoOaHoDDnSw8PcA'

export const supabase = createClient(supabaseUrl, supabaseKey)