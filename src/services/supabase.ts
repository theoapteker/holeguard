/**
 * Supabase Client Configuration
 *
 * This file exports a configured Supabase client instance with TypeScript types.
 *
 * Setup instructions:
 * 1. Install dependencies:
 *    npm install @supabase/supabase-js
 *    or
 *    yarn add @supabase/supabase-js
 *
 * 2. Create a .env file in the project root with:
 *    EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
 *    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
 *
 * 3. Get your credentials from: https://app.supabase.com/project/_/settings/api
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️  Supabase credentials not found!\n\n' +
    'Please create a .env file with:\n' +
    '  EXPO_PUBLIC_SUPABASE_URL=your_project_url\n' +
    '  EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key\n\n' +
    'Get your credentials from:\n' +
    'https://app.supabase.com/project/_/settings/api'
  );
}

// Create and export the Supabase client with TypeScript types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auto-refresh the session
    autoRefreshToken: true,
    // Persist the session in local storage
    persistSession: true,
    // Detect session from URL for magic links and OAuth
    detectSessionInUrl: true,
  },
});

/**
 * Helper function to handle Supabase storage URLs
 * Converts storage paths to public URLs
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Helper function to upload files to Supabase Storage
 *
 * @param bucket - The storage bucket name (e.g., 'avatars')
 * @param path - The file path within the bucket
 * @param file - The file to upload (File or Blob)
 * @param options - Upload options
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: Blob | File,
  options?: {
    contentType?: string;
    upsert?: boolean;
  }
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: options?.contentType,
      upsert: options?.upsert ?? false,
    });

  if (error) {
    throw error;
  }

  return getPublicUrl(bucket, path);
}

/**
 * Helper function to delete files from Supabase Storage
 *
 * @param bucket - The storage bucket name
 * @param paths - Array of file paths to delete
 */
export async function deleteFiles(bucket: string, paths: string[]): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    throw error;
  }
}

/**
 * Helper to check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
}

/**
 * Helper to get current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

/**
 * Helper to sign out
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}
