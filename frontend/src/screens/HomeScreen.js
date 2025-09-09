import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>Signed in as</Text>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 24 }}>{user?.email || 'Unknown'}</Text>
      <TouchableOpacity onPress={logout} style={{ backgroundColor: '#ef4444', padding: 14, borderRadius: 8 }}>
        <Text style={{ color: 'white', fontWeight: '600' }}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}


