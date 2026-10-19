import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { authService } from '../../src/services';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Email is required'); return; }
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="auto" />
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ margin: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 6 }}
      >
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={{ ...typography.bodyMd, color: colors.primary, fontWeight: '600' }}>Back</Text>
      </TouchableOpacity>

      <View style={{ padding: spacing.xl, gap: spacing.xl }}>
        {!sent ? (
          <>
            <View style={{ gap: spacing.xs }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Reset Password</Text>
              <Text style={{ ...typography.bodyLg, color: colors.textSecondary }}>
                Enter your college email and we will dispatch a reset link.
              </Text>
            </View>
            <Input
              label="College email"
              placeholder="you@college.edu"
              value={email}
              onChangeText={v => { setEmail(v); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={error}
            />
            <Button label="Send Reset Link" onPress={handleSubmit} loading={loading} fullWidth size="lg" />
          </>
        ) : (
          <View style={{ gap: spacing.lg, alignItems: 'center', paddingTop: spacing.xxl }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name="mail-unread-outline" size={40} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
              Check your inbox
            </Text>
            <Text style={{ ...typography.bodyMd, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
              If {email} is registered, you will receive a secure password reset link shortly.
            </Text>
            <View style={{
              backgroundColor: colors.primaryLight,
              borderRadius: radii.md,
              padding: spacing.md,
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={{ ...typography.bodySm, color: colors.primary, flex: 1 }}>
                For demonstration purposes, password recovery succeeds automatically for any input.
              </Text>
            </View>
            <Button label="Return to Sign In" onPress={() => router.replace('/(auth)/login')} variant="outline" fullWidth />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
