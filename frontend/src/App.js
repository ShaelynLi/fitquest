import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { auth } from './services/firebase';

export default function App() {
  useEffect(() => {
    console.log('Firebase Auth initialized:', auth);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Firebase Initialized 🎉</Text>
    </View>
  );
}
