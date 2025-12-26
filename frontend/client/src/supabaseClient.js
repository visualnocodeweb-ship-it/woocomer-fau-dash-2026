import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Replace with your Supabase project's URL and Anon Key
const supabaseUrl = 'https://hosypmwsvjvlpurupqdc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvc3lwbXdzdmp2bHB1cnVwcWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NTY4NzcsImV4cCI6MjA4MjMzMjg3N30.FTqKgOSCjMS1anbFLxgxVde-i7Ap0_kT9Hos4MgPaQE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
