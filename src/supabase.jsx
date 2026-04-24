import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project-id.supabase.co'; // Found in Settings > API
const supabaseKey = 'your-anon-key-here'; // Found in Settings > API

export const supabase = createClient(supabaseUrl, supabaseKey);