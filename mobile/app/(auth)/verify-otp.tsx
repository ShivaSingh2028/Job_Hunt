import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/hooks/useAuth';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 1) {
    return `${local}***@${domain}`;
  }
  const first = local[0];
  const last = local.length > 2 ? local[local.length - 1] : '';
  return `${first}***${last}@${domain}`;
}

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; next?: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const { user, verifyEmail, resendVerification } = useAuth();

  const targetEmail = (params.email || user?.email || '').trim().toLowerCase();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Cooldown timer (decrements each second)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResendOtp = async () => {
    if (!targetEmail || cooldown > 0 || resending || isLocked) return;
    setResending(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await resendVerification(targetEmail);
      setStatusMessage('Verification code sent! Check your inbox.');
      setCooldown(res?.resendAvailableInSeconds || 30);
    } catch (err: any) {
      if (err?.code === 'RESEND_TOO_SOON') {
        const retryAfter = err.retryAfterSeconds || 30;
        setCooldown(retryAfter);
        setErrorMessage(`Please wait ${retryAfter}s before requesting a new code.`);
      } else {
        setErrorMessage(err?.message || 'Could not send verification code.');
      }
    } finally {
      setResending(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    setErrorMessage(null);

    // Handle paste of full 6-digit code
    if (value.length > 1) {
      const cleaned = value.replace(/[^0-9]/g, '').slice(0, 6);
      if (cleaned.length > 0) {
        const nextDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = cleaned[i] || '';
        }
        setDigits(nextDigits);
        const focusIndex = Math.min(cleaned.length, 5);
        inputRefs.current[focusIndex]?.focus();
        if (cleaned.length === 6) {
          triggerVerification(cleaned);
        }
        return;
      }
    }

    const nextDigits = [...digits];
    nextDigits[index] = value.replace(/[^0-9]/g, '');
    setDigits(nextDigits);

    // Auto advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 filled
    const allFilled = nextDigits.every(d => d.length === 1);
    if (allFilled) {
      triggerVerification(nextDigits.join(''));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const nextDigits = [...digits];
      nextDigits[index - 1] = '';
      setDigits(nextDigits);
    }
  };

  const triggerVerification = async (otpCode: string) => {
    if (otpCode.length !== 6) {
      setErrorMessage('Please enter all 6 digits.');
      return;
    }
    if (isLocked) return;

    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await verifyEmail(targetEmail, otpCode);
      Alert.alert(
        'Verified! 🎉',
        'Your email has been verified successfully.',
        [
          {
            text: 'Continue',
            onPress: () => {
              if (params.next) {
                router.replace(params.next as any);
              } else {
                router.replace('/(app)');
              }
            },
          },
        ]
      );
    } catch (err: any) {
      const code = err?.code;
      if (code === 'INVALID_CODE') {
        const left = err.attemptsLeft;
        if (typeof left === 'number') {
          setErrorMessage(`Invalid code. ${left} attempt${left === 1 ? '' : 's'} remaining.`);
        } else {
          setErrorMessage(err?.message || 'Invalid verification code.');
        }
      } else if (code === 'CODE_EXPIRED') {
        setErrorMessage('Verification code has expired. Please request a new code.');
      } else if (code === 'TOO_MANY_ATTEMPTS') {
        setIsLocked(true);
        const retrySec = err.retryAfterSeconds || 300;
        setCooldown(retrySec);
        setErrorMessage(`Too many failed attempts. Please wait ${Math.ceil(retrySec / 60)} minute(s) before trying again.`);
      } else {
        setErrorMessage(err?.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fullOtp = digits.join('');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: spacing.xl, justifyContent: 'space-between' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: spacing.xl }}>
            {/* Top Bar */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={{ ...typography.bodyLg, color: colors.primary, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={{ gap: spacing.xs }}>
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: `${colors.primary}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.xs,
              }}>
                <Ionicons name="shield-checkmark" size={30} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Verify Your Email</Text>
              <Text style={{ ...typography.bodyLg, color: colors.textSecondary, marginTop: 4 }}>
                We sent a 6-digit confirmation code to:
              </Text>
              <Text style={{ ...typography.headingSm, color: colors.primary }}>
                {maskEmail(targetEmail) || 'your email'}
              </Text>
            </View>

            {/* 6 Digit Input Boxes */}
            <View style={{ gap: spacing.sm, marginVertical: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                {digits.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => { inputRefs.current[index] = ref; }}
                    style={{
                      flex: 1,
                      height: 56,
                      borderWidth: 2,
                      borderColor: errorMessage ? colors.error : digit ? colors.primary : colors.border,
                      borderRadius: radii.md,
                      backgroundColor: colors.bgSecondary,
                      textAlign: 'center',
                      fontSize: 24,
                      fontWeight: '700',
                      color: colors.text,
                    }}
                    value={digit}
                    onChangeText={val => handleDigitChange(index, val)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!loading && !isLocked}
                  />
                ))}
              </View>

              {errorMessage && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={{ ...typography.caption, color: colors.error, textAlign: 'center' }}>
                    {errorMessage}
                  </Text>
                </View>
              )}

              {statusMessage && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={{ ...typography.caption, color: colors.success, textAlign: 'center' }}>
                    {statusMessage}
                  </Text>
                </View>
              )}
            </View>

            {/* Verify CTA */}
            <Button
              label={loading ? 'Verifying...' : 'Verify & Continue'}
              onPress={() => triggerVerification(fullOtp)}
              loading={loading}
              disabled={fullOtp.length !== 6 || loading || isLocked}
              fullWidth
              size="lg"
            />

            {/* Resend OTP */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
              <Text style={{ ...typography.bodyMd, color: colors.textSecondary }}>Didn't get the code?</Text>
              {cooldown > 0 ? (
                <Text style={{ ...typography.bodyMd, color: colors.textMuted, fontWeight: '600' }}>
                  Resend in {cooldown}s
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp} disabled={resending || isLocked}>
                  {resending ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={{ ...typography.bodyMd, color: colors.primary, fontWeight: '700' }}>
                      Resend Code
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Skip option */}
          <View style={{ marginTop: spacing.xl, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => {
                if (params.next) router.replace(params.next as any);
                else router.replace('/(app)');
              }}
            >
              <Text style={{ ...typography.bodySm, color: colors.textMuted }}>
                Skip for now (Browse only)
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
