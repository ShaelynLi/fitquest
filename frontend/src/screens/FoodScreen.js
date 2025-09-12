import React from 'react';
import { View, Text } from 'react-native';

export default function FoodScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Food</Text>
      <Text>Meal logging and nutrition tracking will be here.</Text>
    </View>
  );
}
