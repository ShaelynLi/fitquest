import React from 'react';
import { View, Text } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Profile</Text>
      <Text>Lifetime stats, achievements, and settings will be here.</Text>
    </View>
  );
}


