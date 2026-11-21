import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { Button } from '../../src/components/ui/Button';
import { KeyboardScreen } from '../../src/components/ui/KeyboardScreen';
import { Banner } from '../../src/components/ui/Banner';
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
  const params = useLocalSearchParams<{ email?: string; next?: string; autoSent?: string }>();
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

  const inputRefs = useRef<(React.ComponentRef<typeof TextInput> | null)[]>([]);
  const hasTriggeredInitialSend = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!hasTriggeredInitialSend.current && targetEmail) {
      hasTriggeredInitialSend.current = true;
      if (params.autoSent !== 'true') {
        handleResendOtp();
      }
    }
  }, [targetEmail]);

  const handleResendOtp = async () => {
    if (!targetEmail || resending || isLocked) return;
    setResending(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await resendVerification(targetEmail);
      if (res?.alreadyVerified) {
        Alert.alert(
          'Already Verified',
          'This email is already verified. You can proceed directly.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace((params.next as any) || '/(app)'),
            },
          ]
        );
        return;
      }
      setStatusMessage('Verification code sent! Please check your inbox.');
      setCooldown(res?.resendAvailableInSeconds || 30);
    } catch (err: any) {
      if (err?.code === 'RESEND_TOO_SOON') {
        const retryAfter = err.retryAfterSeconds || 30;
        setCooldown(retryAfter);
        setErrorMessage(`Please wait ${retryAfter}s before requesting a new code.`);
      } else if (err?.code === 'EMAIL_SEND_FAILED') {
        setErrorMessage("We couldn't deliver the email right now. Please try again.");
      } else {
        setErrorMessage(err?.message || "We couldn't send the code. Please try again.");
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

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const allFilled = nextDigits.every((d) => d.length === 1);
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
        'Verified Successfully',
        'Your email has been verified. Welcome to JobHunt!',
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
        setErrorMessage(
          `Too many failed attempts. Please wait ${Math.ceil(retrySec / 60)} minute(s) before trying again.`
        );
      } else {
        setErrorMessage(err?.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fullOtp = digits.join('');

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
        {/* Header Section */}
        <View style={{ gap: spacing.xs }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radii.full,
              backgroundColor: colors.primaryBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.xs,
              borderWidth: 1,
              borderColor: colors.primaryLight,
            }}
          >
            <Ionicons name="shield-checkmark-outline" size={28} color={colors.primary} />
          </View>
          <Text
            style={{
              ...typography.title,
              fontSize: 26,
              lineHeight: 34,
              color: colors.text,
              fontWeight: '700',
            }}
          >
            Verify your email
          </Text>
          <Text
            style={{
              ...typography.secondary,
              color: colors.textSecondary,
              lineHeight: 20,
              marginTop: 2,
            }}
          >
            We sent a 6-digit confirmation code to:
          </Text>
          <Text
            style={{
              ...typography.heading,
              fontSize: 16,
              color: colors.primary,
              fontWeight: '600',
              fontVariant: ['tabular-nums'],
            }}
          >
            {maskEmail(targetEmail) || 'your email'}
          </Text>
        </View>

        {/* 6 Digit Input Boxes */}
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            {digits.map((digit, index) => {
              const hasDigit = digit.length === 1;
              return (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={{
                    flex: 1,
                    height: 56,
                    borderWidth: hasDigit ? 2 : 1.5,
                    borderColor: errorMessage
                      ? colors.danger
                      : hasDigit
                      ? colors.primary
                      : colors.border,
                    borderRadius: radii.input,
                    backgroundColor: colors.surface,
                    textAlign: 'center',
                    fontSize: 22,
                    fontWeight: '700',
                    fontVariant: ['tabular-nums'],
                    color: colors.text,
                  }}
                  value={digit}
                  onChangeText={(val) => handleDigitChange(index, val)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!loading && !isLocked}
                />
              );
            })}
          </View>

          {/* Feedback Banners */}
          {errorMessage && (
            <Banner
              variant="danger"
              message={errorMessage}
            />
          )}

          {statusMessage && (
            <Banner
              variant="success"
              message={statusMessage}
            />
          )}

          {/* Verify Button */}
          <Button
            label={loading ? 'Verifying...' : 'Verify & Continue'}
            onPress={() => triggerVerification(fullOtp)}
            loading={loading}
            disabled={fullOtp.length !== 6 || loading || isLocked}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.xs }}
          />

          {/* Resend Link & Timer */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6,
              paddingTop: spacing.xs,
            }}
          >
            <Text style={{ ...typography.secondary, color: colors.textSecondary }}>
              Didn't receive the code?
            </Text>
            {cooldown > 0 ? (
              <Text
                style={{
                  ...typography.secondary,
                  color: colors.textMuted,
                  fontWeight: '600',
                  fontVariant: ['tabular-nums'],
                }}
              >
                Resend in {cooldown}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendOtp} disabled={resending || isLocked}>
                {resending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text
                    style={{
                      ...typography.secondary,
                      color: colors.primary,
                      fontWeight: '700',
                    }}
                  >
                    Resend Code
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Skip Link */}
        <View style={{ alignItems: 'center', paddingTop: spacing.md }}>
          <TouchableOpacity
            onPress={() => {
              if (params.next) router.replace(params.next as any);
              else router.replace('/(app)');
            }}
          >
            <Text style={{ ...typography.caption, color: colors.textMuted }}>
              Skip for now (Browse only)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardScreen>
  );
}
