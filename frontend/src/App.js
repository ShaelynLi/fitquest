import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { View, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import RunScreen from './screens/RunScreen';
import PlusScreen from './screens/PlusScreen';
import FoodScreen from './screens/FoodScreen';
import ProfileScreen from './screens/ProfileScreen';
import PokedexScreen from './screens/PokedexScreen';
import FoodSearchScreen from './screens/FoodSearchScreen';
import FoodTab from './tabs/FoodTab';
import { Ionicons } from '@expo/vector-icons';
import { colors, globalStyles } from './theme';
import backendApi from './services/backendApi';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 34,
          marginHorizontal: 16,
          backgroundColor: colors.black,
          borderRadius: 25,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          borderWidth: 1,
          borderColor: colors.black,
        },
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarShowLabel: false,
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
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Run"
        component={RunScreen}
        options={{
          tabBarLabel: 'Run',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'walk' : 'walk-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Plus"
        component={PlusScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={{
                backgroundColor: focused ? colors.white : colors.gray[600],
                borderWidth: 1,
                borderColor: focused ? colors.white : colors.gray[500],
                borderRadius: 25,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name="add"
                size={20}
                color={focused ? colors.black : colors.white}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Food"
        component={FoodScreen}
        options={{
          tabBarLabel: 'Food',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'restaurant' : 'restaurant-outline'}
              size={size}
              color={color}
            />
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
              size={size}
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
  if (loading) return null;
  return (
    <Stack.Navigator>
      {user ? (
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
  useEffect(() => {
    // 测试网络连接
    const testNetworkConnection = async () => {
      console.log('🔍 Testing network connection on app startup...');
      try {
        const result = await backendApi.testConnection();
        if (result.success) {
          console.log('✅ Network connection successful:', result.data);
        } else {
          console.error('❌ Network connection failed:', result.error);
          // 在开发模式下显示警告
          if (__DEV__) {
            Alert.alert(
              'Network Connection Issue',
              `Failed to connect to backend API: ${result.error}\n\nPlease check:\n1. Your internet connection\n2. Backend service status\n3. API URL configuration`,
              [{ text: 'OK' }]
            );
          }
        }
      } catch (error) {
        console.error('❌ Network test error:', error);
      }
    };

    // 延迟3秒后测试，给应用启动时间
    const timeoutId = setTimeout(testNetworkConnection, 3000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
