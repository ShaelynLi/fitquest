import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { View, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GamificationProvider } from './context/GamificationContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import RunTab from './tabs/RunTab';
import PlusScreen from './screens/PlusScreen';
import ProfileScreen from './screens/ProfileScreen';
import PokedexScreen from './screens/PokedexScreen';
import PetCollectionScreen from './screens/PetCollectionScreen';
import FoodSearchScreen from './screens/FoodSearchScreen';
import FoodTab from './tabs/FoodTab';
import { Ionicons } from '@expo/vector-icons';
import { colors, globalStyles } from './theme';
import { api } from './services';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.gray[200],
          height: 88,
          paddingBottom: 34, // Safe area for newer devices
          paddingTop: 8,
          paddingHorizontal: 0,
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarShowLabel: false,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
          alignItems: 'center',
          justifyContent: 'center',
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
              size={24}
              color={focused ? colors.textPrimary : colors.gray[400]}
            />
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      />
      <Tab.Screen
        name="Plus"
        component={PlusScreen}
        options={{
          tabBarLabel: 'Add',
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.textPrimary,
                shadowColor: colors.black,
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons
                name="add"
                size={20}
                color={colors.white}
              />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
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
              size={24}
              color={focused ? colors.textPrimary : colors.gray[400]}
            />
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  // Bypass authentication for development - always show main app
  const BYPASS_AUTH = true;
  
  const { user, loading } = useAuth();
  if (!BYPASS_AUTH && loading) return null;
  
  return (
    <Stack.Navigator>
      {BYPASS_AUTH || user ? (
        <>
          <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="Pokedex" component={PokedexScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PetCollection" component={PetCollectionScreen} options={{ headerShown: false }} />
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
        const result = await api.healthCheck();
        console.log('✅ Network connection successful:', result);
      } catch (error) {
        console.error('❌ Network connection failed:', error.message);
        // 在开发模式下显示警告
        if (__DEV__) {
          Alert.alert(
            'Network Connection Issue',
            `Failed to connect to backend API: ${error.message}\n\nPlease check:\n1. Your internet connection\n2. Backend service status\n3. API URL configuration`,
            [{ text: 'OK' }]
          );
        }
      }
    };

    // 延迟3秒后测试，给应用启动时间
    const timeoutId = setTimeout(testNetworkConnection, 3000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <AuthProvider>
      <GamificationProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </GamificationProvider>
    </AuthProvider>
  );
}
