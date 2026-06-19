/* supabase-client.js
 * Wraps initialization in an IIFE so this script is safe to load multiple times.
 * The client is stored on window.supabaseClient (not as a const in global scope)
 * to avoid "Identifier already declared" SyntaxErrors.
 */
(function () {
    if (window.supabaseClient) return; // already initialized, skip

    var SUPABASE_URL = "https://syxuguxhnaoqafreklbr.supabase.co";
    var SUPABASE_KEY = "sb_publishable_BkNTJMFpBmxuLZMr8BGYIA_kUpC_qcR";

    // window.supabase is the CDN library; .createClient() returns our app client
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
})();