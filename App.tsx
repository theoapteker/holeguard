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

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StatsScreen } from './src/screens/StatsScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import type { RootStackParamList } from './src/navigation/types';

const Tab = createBottomTabNavigator<RootStackParamList>();

// Example user ID - in a real app, this would come from authentication
const CURRENT_USER_ID = '00000000-0000-0000-0000-000000000000';

export default function App() {
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
        <Tab.Navigator
          screenOptions={{
            headerShown: true,
            tabBarActiveTintColor: '#3b82f6',
            tabBarInactiveTintColor: '#6b7280',
            tabBarStyle: {
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
              backgroundColor: '#fff',
            },
            headerStyle: {
              backgroundColor: '#fff',
              borderBottomWidth: 1,
              borderBottomColor: '#e5e7eb',
            },
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          }}
        >
          <Tab.Screen
            name="Stats"
            options={{
              title: 'My Stats',
              tabBarLabel: 'Stats',
              headerShown: false, // StatsScreen has its own header
            }}
          >
            {(props) => (
              <StatsScreen
                {...props}
                playerId={CURRENT_USER_ID}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Leaderboard"
            options={{
              title: 'Leaderboard',
              tabBarLabel: 'Leaderboard',
              headerShown: false, // LeaderboardScreen has its own header
            }}
          >
            {(props) => (
              <LeaderboardScreen
                {...props}
                currentUserId={CURRENT_USER_ID}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
