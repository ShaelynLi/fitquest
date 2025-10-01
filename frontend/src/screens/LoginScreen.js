import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography, globalStyles } from '../theme';

/**
 * LoginScreen Component
 *
 * Handles user authentication with email/password.
 * Uses the app's design system for consistent styling.
 *
 * Navigation: Can navigate to RegisterScreen
 * Context: Uses AuthContext for login functionality
 */
export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      // On successful login, go to main app
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>

      {/* Error Message */}
      {!!error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Email Input */}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        placeholderTextColor={colors.textSecondary}
      />

      {/* Password Input */}
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor={colors.textSecondary}
      />

      {/* Login Button */}
      <TouchableOpacity
        onPress={onSubmit}
        disabled={loading}
        style={[styles.loginButton, loading && styles.disabledButton]}
      >
        <Text style={styles.loginButtonText}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      {/* Register Link */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Onboarding')}
        style={styles.registerLink}
      >
        <Text style={styles.registerText}>
          New here? Create an account
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textPrimary,
  },
  loginButton: {
    ...globalStyles.buttonPrimary,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    ...globalStyles.buttonTextPrimary,
  },
  registerLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  registerText: {
    color: colors.accent,
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.medium,
  },
});


