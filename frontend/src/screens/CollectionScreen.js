import React from 'react';
import { View, Text } from 'react-native';

export default function CollectionScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Collection</Text>
      <Text>Pet Dex grid and details will go here.</Text>
    </View>
  );
}


