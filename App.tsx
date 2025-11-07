import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

// Import navigation
import AppNavigator from './src/navigation/AppNavigator';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // TODO: Implement actual authentication check
      // For now, we'll simulate a delay and default to unauthenticated
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if user is authenticated (e.g., from AsyncStorage, SecureStore, etc.)
      // const token = await SecureStore.getItemAsync('userToken');
      // setIsAuthenticated(!!token);

      setIsAuthenticated(false); // Default to not authenticated
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const onLayoutRootView = useCallback(async () => {
    if (!isLoading) {
      // Hide the splash screen once we know the auth state
      await SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <NavigationContainer>
        <AppNavigator isLoading={isLoading} isAuthenticated={isAuthenticated} />
        <StatusBar style="auto" />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
