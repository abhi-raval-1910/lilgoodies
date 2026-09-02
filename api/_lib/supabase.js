const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

function requireSupabase() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error('Supabase URL and key environment variables are not configured');
    }
}

async function supabaseRequest(path, options = {}) {
    requireSupabase();
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...options,
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(`Supabase request failed: ${response.status} ${message}`);
    }

    const body = await response.text();
    return body ? JSON.parse(body) : null;
}

module.exports = { supabaseRequest };