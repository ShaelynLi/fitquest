import React from 'react';
import { View, Text } from 'react-native';

export default function RunScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Run</Text>
      <Text>Pre-Run / Live / Summary flow will live here.</Text>
    </View>
  );
}


