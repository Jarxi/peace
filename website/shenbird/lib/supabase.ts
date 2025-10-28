import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://moyvndlvttijyuyzxfwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1veXZuZGx2dHRpanl1eXp4Znd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTA0MDgsImV4cCI6MjA3NDg2NjQwOH0.a4cnrsmmigLuSlSwLXVl4xTJ4GI0CUdGs3GuG6Sni2I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);