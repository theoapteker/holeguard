/**
 * Example Navigation Setup for CreateGameScreen
 *
 * This file demonstrates how to set up navigation types and integrate
 * the CreateGameScreen into your React Navigation setup.
 */

import { NavigationProp, RouteProp } from '@react-navigation/native';

// Define your navigation stack param list
export type RootStackParamList = {
  Home: undefined;
  GameFeed: undefined;
  CreateGame: undefined;
  GameDetails: { gameId: string };
  Profile: { userId: string };
};

// Navigation prop type for CreateGameScreen
export type CreateGameScreenNavigationProp = NavigationProp<RootStackParamList, 'CreateGame'>;

// Route prop type for CreateGameScreen
export type CreateGameScreenRouteProp = RouteProp<RootStackParamList, 'CreateGame'>;

// Updated screen props interface
export interface CreateGameScreenProps {
  navigation: CreateGameScreenNavigationProp;
  route: CreateGameScreenRouteProp;
}

/**
 * Example App.tsx with navigation setup
 *
 * import React from 'react';
 * import { NavigationContainer } from '@react-navigation/native';
 * import { createNativeStackNavigator } from '@react-navigation/native-stack';
 * import CreateGameScreen from './src/screens/CreateGameScreen';
 * import type { RootStackParamList } from './src/screens/navigation.example';
 *
 * const Stack = createNativeStackNavigator<RootStackParamList>();
 *
 * export default function App() {
 *   return (
 *     <NavigationContainer>
 *       <Stack.Navigator
 *         initialRouteName="GameFeed"
 *         screenOptions={{
 *           headerStyle: { backgroundColor: '#3498db' },
 *           headerTintColor: '#fff',
 *           headerTitleStyle: { fontWeight: 'bold' },
 *         }}
 *       >
 *         <Stack.Screen
 *           name="GameFeed"
 *           component={GameFeedScreen}
 *           options={{ title: 'WaterPolo Connect' }}
 *         />
 *         <Stack.Screen
 *           name="CreateGame"
 *           component={CreateGameScreen}
 *           options={{
 *             title: 'Create New Game',
 *             headerBackTitle: 'Cancel',
 *           }}
 *         />
 *         <Stack.Screen
 *           name="GameDetails"
 *           component={GameDetailsScreen}
 *           options={{ title: 'Game Details' }}
 *         />
 *       </Stack.Navigator>
 *     </NavigationContainer>
 *   );
 * }
 */

/**
 * Example: Navigate to CreateGameScreen from any component
 *
 * import { useNavigation } from '@react-navigation/native';
 * import { CreateGameScreenNavigationProp } from './navigation.example';
 *
 * function GameFeedScreen() {
 *   const navigation = useNavigation<CreateGameScreenNavigationProp>();
 *
 *   return (
 *     <TouchableOpacity onPress={() => navigation.navigate('CreateGame')}>
 *       <Text>Create New Game</Text>
 *     </TouchableOpacity>
 *   );
 * }
 */
