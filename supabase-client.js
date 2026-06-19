/* supabase-client.js */

const SUPABASE_URL = "sb_publishable_BkNTJMFpBmxuLZMr8BGYIA_kUpC_qcR";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eHVndXhobmFvcWFmcmVrbGJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5NTg1NSwiZXhwIjoyMDk3MzcxODU1fQ.CRYfs4nyIirPkM11ZPiid76iqNzUCrCBLOOGbFg0e6A";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);