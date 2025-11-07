import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// TODO: Replace with your actual Supabase project credentials
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export interface AuthError {
  message: string;
  status?: number;
}

export interface SignUpData {
  email: string;
  password: string;
  username: string;
  fullName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  signUp: async (data: SignUpData) => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.fullName,
          },
        },
      });

      if (error) throw error;
      return { data: authData, error: null };
    } catch (error: any) {
      return { data: null, error: error as AuthError };
    }
  },

  signIn: async (data: SignInData) => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      return { data: authData, error: null };
    } catch (error: any) {
      return { data: null, error: error as AuthError };
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error: error as AuthError };
    }
  },
};
