import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen, SignUpScreen, LoginScreen } from './src/screens/auth';

export type AuthStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  Login: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitleVisible: false,
            headerTransparent: true,
          }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitleVisible: false,
            headerTransparent: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
