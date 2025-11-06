import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tsqjsghujhbsjvfbsann.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzcWpzZ2h1amhic2p2ZmJzYW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4OTM2MjIsImV4cCI6MjA3NTQ2OTYyMn0.X8_GsZqWyr_nInApfUjnKWG23HDnq4O3UD-rMCqAf-E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);