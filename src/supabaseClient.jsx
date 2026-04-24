import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cvmithnmwkypunmatahd.supabase.co'
const supabaseAnonKey = 'sb_publishable_P6wxtWnPgQXXcpqL-gY2fQ_4bNnjojv'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)