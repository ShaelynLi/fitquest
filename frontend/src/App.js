import React from 'react';
import 'react-native-gesture-handler';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import PlusScreen from './screens/PlusScreen';
import ProfileScreen from './screens/ProfileScreen';
import PokedexScreen from './screens/PokedexScreen';
import FoodSearchScreen from './screens/FoodSearchScreen';
import FoodTab from './tabs/FoodTab';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, globalStyles } from './theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
// Development-only: bypass authentication and jump straight to the app
const BYPASS_AUTH = true;

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 34,
          marginHorizontal: 16,
          backgroundColor: colors.surface,
          borderRadius: 25,
          height: 70,
          paddingBottom: 12,
          paddingTop: 12,
          // Aura Health design system - subtle shadow
          shadowColor: colors.black,
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: typography.body,
          fontWeight: typography.weights.medium,
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Plus"
        component={PlusScreen}
        options={{
          tabBarLabel: 'Quick Actions',
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={{
                backgroundColor: focused ? colors.textPrimary : colors.gray[300],
                borderRadius: 20,
                width: 36,
                height: 36,
                justifyContent: 'center',
                alignItems: 'center',
                // Subtle shadow for the plus button
                shadowColor: colors.black,
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Ionicons
                name="add"
                size={18}
                color={focused ? colors.white : colors.textPrimary}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  if (!BYPASS_AUTH && loading) return null;
  return (
    <Stack.Navigator>
      {BYPASS_AUTH || user ? (
        <>
          <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="Pokedex" component={PokedexScreen} options={{ headerShown: false }} />
          <Stack.Screen name="FoodLog" component={FoodTab} options={{ headerShown: false }} />
          <Stack.Screen name="FoodSearch" component={FoodSearchScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
