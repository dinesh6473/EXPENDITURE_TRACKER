// Supabase Configuration
const SUPABASE_URL = 'https://gfzlfsuqslugbcobqcsn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmemxmc3Vxc2x1Z2Jjb2JxY3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzk3MDIsImV4cCI6MjA4Nzc1NTcwMn0.rddMNAALPs9bUUZcbXDd-4Q7m9uD752wvxIk8nZb0hg';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
