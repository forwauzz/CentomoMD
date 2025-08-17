import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn('SUPABASE_URL not found. Migration will be prepared but not active.');
}

if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not found. Migration will be prepared but not active.');
}

// Create Supabase client (only if both URL and key are available)
export const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-application-name': 'CentomoMD'
        }
      }
    })
  : null;

// Migration status checker
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

// Database connection test
export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// HIPAA-compliant audit logging
export async function logAuditEvent(event: {
  table_name: string;
  record_id?: string;
  action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  user_id?: string;
  user_ip?: string;
  user_agent?: string;
  old_values?: any;
  new_values?: any;
  session_id?: string;
}) {
  if (!supabase) {
    console.log('Audit log (no Supabase):', event);
    return;
  }

  try {
    await supabase.from('audit_logs').insert({
      ...event,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging failure shouldn't break the application
  }
}

export default supabase;