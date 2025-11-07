import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database, SignUpData, SignInData, UpdateProfileData, ApiResponse, Profile } from '../types';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
}

// Initialize Supabase client
export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Sign up a new user with email and password
 * Creates both an auth user and a profile record
 */
export async function signUp(
  email: string,
  password: string,
  username: string,
  fullName: string
): Promise<ApiResponse<User>> {
  try {
    // Validate inputs
    if (!email || !password || !username || !fullName) {
      return {
        data: null,
        error: {
          message: 'All fields are required: email, password, username, and full name',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    if (password.length < 6) {
      return {
        data: null,
        error: {
          message: 'Password must be at least 6 characters long',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
        },
      },
    });

    if (authError) {
      return {
        data: null,
        error: {
          message: authError.message,
          code: authError.code,
          details: authError,
        },
      };
    }

    if (!authData.user) {
      return {
        data: null,
        error: {
          message: 'Failed to create user account',
          code: 'SIGNUP_FAILED',
        },
      };
    }

    // Create profile record
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email,
      username,
      full_name: fullName,
    });

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      // However, Supabase doesn't allow deleting users from client side
      // This should be handled by a database trigger or backend function
      console.error('Profile creation failed:', profileError);
      return {
        data: null,
        error: {
          message: 'Failed to create user profile. Please contact support.',
          code: 'PROFILE_CREATION_FAILED',
          details: profileError,
        },
      };
    }

    return {
      data: authData.user,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error during sign up:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during sign up',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}

/**
 * Sign in a user with email and password
 */
export async function signIn(email: string, password: string): Promise<ApiResponse<User>> {
  try {
    // Validate inputs
    if (!email || !password) {
      return {
        data: null,
        error: {
          message: 'Email and password are required',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error,
        },
      };
    }

    if (!data.user) {
      return {
        data: null,
        error: {
          message: 'Failed to sign in',
          code: 'SIGNIN_FAILED',
        },
      };
    }

    return {
      data: data.user,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error during sign in:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during sign in',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error,
        },
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error during sign out:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during sign out',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}

/**
 * Get the currently authenticated user
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error,
        },
      };
    }

    if (!user) {
      return {
        data: null,
        error: {
          message: 'No authenticated user found',
          code: 'NO_USER',
        },
      };
    }

    return {
      data: user,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error getting current user:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred getting current user',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}

/**
 * Update a user's profile
 */
export async function updateProfile(
  userId: string,
  profileData: UpdateProfileData
): Promise<ApiResponse<Profile>> {
  try {
    // Validate inputs
    if (!userId) {
      return {
        data: null,
        error: {
          message: 'User ID is required',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    if (!profileData || Object.keys(profileData).length === 0) {
      return {
        data: null,
        error: {
          message: 'Profile data is required',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Update profile in database
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error,
        },
      };
    }

    if (!data) {
      return {
        data: null,
        error: {
          message: 'Failed to update profile',
          code: 'UPDATE_FAILED',
        },
      };
    }

    // If username or full_name is updated, also update auth metadata
    if (profileData.username || profileData.full_name) {
      const metadataUpdate: { username?: string; full_name?: string } = {};
      if (profileData.username) metadataUpdate.username = profileData.username;
      if (profileData.full_name) metadataUpdate.full_name = profileData.full_name;

      await supabase.auth.updateUser({
        data: metadataUpdate,
      });
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating profile:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred updating profile',
        code: 'UNEXPECTED_ERROR',
        details: error,
      },
    };
  }
}

/**
 * Listen to auth state changes
 * @param callback Function to call when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => {
    subscription.unsubscribe();
  };
}

export default supabase;
