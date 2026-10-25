import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://guqydatxzgvbrqxkbhtt.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1cXlkYXR4emd2YnJxeGtiaHR0cDovL3N1cGFiYXNlLmNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MjE4NDEsImV4cCI6MjEwODQ5Nzg0MX0.w2QP5cujMp2TyIqTBsEtbex1E2eCVT9oCunTi9ME0a8';

export const supabase = createClient(supabaseUrl, supabaseKey);
