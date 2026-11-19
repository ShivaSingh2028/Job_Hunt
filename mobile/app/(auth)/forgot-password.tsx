import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import { KeyboardScreen } from '../../src/components/ui/KeyboardScreen';
import { Card } from '../../src/components/ui/Card';
import { authService } from '../../src/services';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      Alert.alert('Reset Error', err?.message || 'Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardScreen>
      {/* Top back navigation */}
      <TouchableOpacity
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          alignSelf: 'flex-start',
          marginBottom: spacing.lg,
        }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
        <Text style={{ ...typography.secondary, color: colors.text, fontWeight: '600' }}>
          Back
        </Text>
      </TouchableOpacity>

      <View style={{ gap: spacing.xl }}>
        {!sent ? (
          <>
            <View style={{ gap: spacing.xs }}>
              <Text
                style={{
                  ...typography.title,
                  fontSize: 26,
                  lineHeight: 34,
                  color: colors.text,
                  fontWeight: '700',
                }}
              >
                Reset password
              </Text>
              <Text
                style={{
                  ...typography.secondary,
                  color: colors.textSecondary,
                  lineHeight: 20,
                }}
              >
                Enter your email address and we will dispatch a secure reset link.
              </Text>
            </View>

            <View style={{ gap: spacing.md }}>
              <TextField
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (error) setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={error}
                leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
              />

              <Button
                label="Send Reset Link"
                onPress={handleSubmit}
                loading={loading}
                fullWidth
                size="lg"
                style={{ marginTop: spacing.xs }}
              />
            </View>
          </>
        ) : (
          <View style={{ gap: spacing.lg, alignItems: 'center', paddingTop: spacing.xl }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: radii.full,
                backgroundColor: colors.primaryBg,
                borderWidth: 1,
                borderColor: colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="mail-unread-outline" size={36} color={colors.primary} />
            </View>

            <Text
              style={{
                ...typography.title,
                fontSize: 24,
                color: colors.text,
                textAlign: 'center',
                fontWeight: '700',
              }}
            >
              Check your inbox
            </Text>

            <Text
              style={{
                ...typography.body,
                color: colors.textSecondary,
                textAlign: 'center',
                lineHeight: 22,
                maxWidth: 320,
              }}
            >
              If <Text style={{ color: colors.text, fontWeight: '600' }}>{email}</Text> is registered, you will receive a password reset link shortly.
            </Text>

            <Card
              variant="flat"
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                padding: spacing.md,
                backgroundColor: colors.primaryBg,
              }}
            >
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text
                style={{
                  ...typography.caption,
                  color: colors.primary,
                  flex: 1,
                  lineHeight: 16,
                }}
              >
                Please check your spam or junk folder if the email does not arrive within a few minutes.
              </Text>
            </Card>

            <Button
              label="Return to Sign In"
              onPress={() => router.replace('/(auth)/login')}
              variant="outline"
              fullWidth
              size="lg"
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}
      </View>
    </KeyboardScreen>
  );
}
