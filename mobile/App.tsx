/**
 * Main App Component
 * Entry point for the Mufradat mobile application
 */

import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { store } from './src/store';
import { AuthProvider } from './src/contexts/AuthContext';
import { LoginScreen, RegisterScreen } from './src/screens/auth';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { StatusBar } from 'expo-status-bar';

const Stack = createStackNavigator();

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#3498db',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                title: 'Create Account',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{
                title: 'Dashboard',
                headerLeft: () => null, // Hide back button on dashboard screen
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </Provider>
  );
}
