import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/lib/supabase';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import { Session } from '@supabase/supabase-js';

// Placeholder screens - replace with your actual screens
function AuthScreen() {
  return null; // Your auth screen would go here
}

function MainAppScreen() {
  return null; // Your main app screen would go here
}

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        checkProfile(session.user.id);
      } else {
        setHasProfile(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      setHasProfile(!!data && !error);
    } catch (error) {
      console.error('Error checking profile:', error);
      setHasProfile(false);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = () => {
    if (session?.user) {
      checkProfile(session.user.id);
    }
  };

  if (loading) {
    return null; // You could show a loading screen here
  }

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!session ? (
            // Not authenticated - show auth screen
            <Stack.Screen name="Auth" component={AuthScreen} />
          ) : !hasProfile ? (
            // Authenticated but no profile - show profile setup
            <Stack.Screen name="ProfileSetup">
              {() => <ProfileSetupScreen onComplete={handleProfileComplete} />}
            </Stack.Screen>
          ) : (
            // Authenticated with profile - show main app
            <Stack.Screen name="Main" component={MainAppScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
