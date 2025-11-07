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
