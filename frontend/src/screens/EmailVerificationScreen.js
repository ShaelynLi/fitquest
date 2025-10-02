import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { api } from '../services';
import { useAuth } from '../context/AuthContext';

export default function EmailVerificationScreen({ navigation, route }) {
  const { email, tempToken } = route.params || {};
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, verified, failed

  // 检查验证状态（只在用户手动点击时调用）
  const checkVerificationStatus = async () => {
    if (!email) {
      Alert.alert('Error', 'Email not found. Please try registering again.');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔍 Checking verification status for:', email);
      console.log('📧 Route params:', route.params);
      
      // 直接检查邮箱验证状态
      const status = await api.checkVerificationStatus(email);
      console.log('✅ Verification status check result:', status);
      
      if (status.email_verified) {
        console.log('🎉 Email is verified! Proceeding with login...');
        setVerificationStatus('verified');
        Alert.alert(
          'Email Verified Successfully!',
          'Your email has been verified. You will now be logged in.',
          [{ 
            text: 'Continue', 
            onPress: async () => {
              try {
                console.log('🔐 Attempting login with:', email);
                await login(email, route.params.password);
                console.log('✅ Login successful, navigating to main...');
                navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
              } catch (loginError) {
                console.error('❌ Login error:', loginError);
                Alert.alert('Login Error', 'Failed to log in. Please try again.');
              }
            }
          }]
        );
      } else {
        console.log('⏳ Email not yet verified');
        setVerificationStatus('pending');
        Alert.alert(
          'Email Not Yet Verified',
          'Your email verification is still pending. Please check your email and click the verification link. If you haven\'t received the email, try resending it.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Verification check error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      setVerificationStatus('pending');
      Alert.alert(
        'Verification Check Failed',
        `Unable to check your email verification status. Error: ${error.message}. Please make sure you have clicked the verification link in your email, then try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // 重发验证邮件
  const resendVerificationEmail = async () => {
    if (!tempToken) {
      Alert.alert('Error', 'Unable to resend verification email. Please try registering again.');
      return;
    }
    
    setResendLoading(true);
    try {
      console.log('Resending verification email with token:', tempToken);
      await api.resendVerificationEmail(tempToken);
      Alert.alert(
        'Verification Email Sent',
        'A new verification email has been sent to your inbox. Please check your email and click the verification link.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Resend verification error:', error);
      Alert.alert(
        'Failed to Resend Email',
        'Unable to resend verification email. Please try again or contact support if the problem persists.',
        [{ text: 'OK' }]
      );
    } finally {
      setResendLoading(false);
    }
  };

  // 打开邮箱应用
  const openEmailApp = () => {
    // 使用更通用的方法，尝试打开邮箱应用而不创建新邮件
    const emailApps = [
      // iOS Mail 应用
      'message://',
      // Gmail (如果安装了)
      'googlegmail://',
      // Outlook (如果安装了)
      'ms-outlook://',
      // 通用邮件应用
      'mailto:',
    ];

    const tryOpenEmailApp = async (index = 0) => {
      if (index >= emailApps.length) {
        // 如果所有方法都失败，显示提示
        Alert.alert(
          'Open Email App',
          'Please manually open your email app to check for the verification email.',
          [{ text: 'OK' }]
        );
        return;
      }

      try {
        const canOpen = await Linking.canOpenURL(emailApps[index]);
        if (canOpen) {
          await Linking.openURL(emailApps[index]);
        } else {
          tryOpenEmailApp(index + 1);
        }
      } catch (error) {
        tryOpenEmailApp(index + 1);
      }
    };

    tryOpenEmailApp();
  };

  // 返回重新注册
  const goBackToRegistration = () => {
    navigation.goBack();
  };

  useEffect(() => {
    // 不自动检查验证状态，只等待用户手动点击
    // 移除自动检查逻辑，避免无限循环提醒
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail" size={80} color={colors.aurora.blue} />
        </View>

        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification link to:
        </Text>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            1. Check your email inbox (and spam folder)
          </Text>
          <Text style={styles.instructionText}>
            2. Click the verification link in the email
          </Text>
          <Text style={styles.instructionText}>
            3. Return to this app and tap "I've Clicked the Verification Link"
          </Text>
        </View>

        {verificationStatus === 'verified' && (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={24} color={colors.aurora.green} />
            <Text style={styles.successText}>Email verified successfully!</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={openEmailApp}
          disabled={loading}
        >
          <Ionicons name="mail-outline" size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Open Email App</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={resendVerificationEmail}
          disabled={resendLoading || loading}
        >
          {resendLoading ? (
            <ActivityIndicator size="small" color={colors.aurora.blue} />
          ) : (
            <Ionicons name="refresh" size={20} color={colors.aurora.blue} />
          )}
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            {resendLoading ? 'Sending...' : 'Resend Email'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkButton}
          onPress={checkVerificationStatus}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="checkmark" size={20} color={colors.white} />
          )}
          <Text style={styles.checkButtonText}>
            {loading ? 'Checking...' : 'I\'ve Clicked the Verification Link'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={goBackToRegistration}
        >
          <Text style={styles.backButtonText}>Back to Registration</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.heading,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  email: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.aurora.blue,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  instructions: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  instructionText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.aurora.blue + '20',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.aurora.blue,
    marginLeft: spacing.sm,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.aurora.green + '20',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  successText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.aurora.green,
    marginLeft: spacing.sm,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.aurora.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.aurora.blue,
  },
  actionButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  secondaryButtonText: {
    color: colors.aurora.blue,
  },
  checkButton: {
    backgroundColor: colors.aurora.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  checkButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.body,
    color: colors.textSecondary,
  },
});
