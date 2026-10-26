import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../src/hooks/useTheme';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/hooks/useAuth';

import { Logo } from '../../src/components/ui/Logo';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radii } = useTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(app)');
    } catch (err: any) {
      const code = err?.code;
      if (code === 'UNAUTHORIZED') setErrors({ password: 'Incorrect password' });
      else if (code === 'NOT_FOUND') setErrors({ email: 'No account with this email' });
      else if (code === 'USER_BLOCKED') Alert.alert('Account Blocked', err.message);
      else Alert.alert('Login Failed', err?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ margin: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={{ ...typography.bodyMd, color: colors.primary, fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>

        <View style={{ padding: spacing.xl, gap: spacing.xl }}>
          {/* Header */}
          <View style={{ gap: spacing.sm }}>
            <Logo size={46} showText={true} textColor={colors.text} subtitle="Campus Gig Platform" />
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 4 }}>Welcome Back</Text>
            <Text style={{ ...typography.bodyLg, color: colors.textSecondary }}>
              Sign in to find or post gigs near campus
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: spacing.md }}>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />
            <Input
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              error={errors.password}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                  <Text style={{ color: colors.primary, fontSize: 13 }}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              }
            />

            <TouchableOpacity
              style={{ alignSelf: 'flex-end' }}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={{ ...typography.label, color: colors.primary }}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              label="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          {/* Footer */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
            <Text style={{ ...typography.bodyMd, color: colors.textSecondary }}>New here?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={{ ...typography.bodyMd, color: colors.primary, fontWeight: '600' }}>Create account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
