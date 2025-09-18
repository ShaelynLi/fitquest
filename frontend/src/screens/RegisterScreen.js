import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await register(email.trim(), password, displayName.trim());
    } catch (e) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ fontSize: 28, fontWeight: '600', marginBottom: 16, color: colors.textPrimary }}>Create account</Text>
      {!!error && <Text style={{ color: colors.error, marginBottom: 8 }}>{error}</Text>}
      <TextInput
        placeholder="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholderTextColor={colors.textSecondary}
        style={{ borderWidth: 1, borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface, borderRadius: 8, padding: 12, marginBottom: 12 }}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={colors.textSecondary}
        style={{ borderWidth: 1, borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface, borderRadius: 8, padding: 12, marginBottom: 12 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={colors.textSecondary}
        style={{ borderWidth: 1, borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface, borderRadius: 8, padding: 12, marginBottom: 12 }}
      />
      <TouchableOpacity onPress={onSubmit} disabled={loading} style={{ backgroundColor: colors.white, padding: 14, borderRadius: 8, alignItems: 'center' }}>
        <Text style={{ color: colors.black, fontWeight: '600' }}>{loading ? 'Creating...' : 'Create Account'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16, alignItems: 'center' }}>
        <Text style={{ color: colors.info }}>Have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}


