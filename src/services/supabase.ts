import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

/**
 * Supabase Client Configuration
 *
 * To use this client, you need to set the following environment variables:
 * - SUPABASE_URL or REACT_APP_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL
 * - SUPABASE_ANON_KEY or REACT_APP_SUPABASE_ANON_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY
 *
 * For React Native (Expo):
 * - Add these to your .env file or app.config.js
 *
 * For React Web:
 * - Add these to your .env file with REACT_APP_ prefix
 */

const getEnvVar = (key: string): string => {
  // Try different environment variable naming conventions
  const value =
    process.env[key] ||
    process.env[`REACT_APP_${key}`] ||
    process.env[`EXPO_PUBLIC_${key}`] ||
    // Fallback for development (replace with your actual values)
    '';

  if (!value) {
    console.warn(`Environment variable ${key} is not set`);
  }

  return value;
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://your-project.supabase.co',
  supabaseAnonKey || 'your-anon-key'
);

/**
 * Helper function to handle Supabase errors
 */
export const handleSupabaseError = (error: any, context: string) => {
  console.error(`Supabase error in ${context}:`, error);
  return {
    error: error.message || 'An unexpected error occurred',
    details: error,
  };
};
