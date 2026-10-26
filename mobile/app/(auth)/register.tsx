import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../src/hooks/useTheme';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/hooks/useAuth';

import { Logo } from '../../src/components/ui/Logo';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const { signup } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(form.name.trim(), form.email.trim().toLowerCase(), form.password, form.phone || undefined);
      router.replace({
        pathname: '/(auth)/verify-otp',
        params: { email: form.email.trim().toLowerCase(), next: '/(app)' },
      } as any);
    } catch (err: any) {
      if (err?.code === 'EMAIL_ALREADY_REGISTERED' || err?.code === 'CONFLICT') {
        setErrors({ email: 'This email is already registered' });
      } else if (err?.code === 'VALIDATION_ERROR') {
        Alert.alert('Validation Error', err?.message || 'Please check your inputs.');
      } else {
        Alert.alert('Registration Failed', err?.message || 'Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ margin: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={{ ...typography.bodyMd, color: colors.primary, fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>

        <View style={{ padding: spacing.xl, gap: spacing.xl }}>
          <View style={{ gap: spacing.sm }}>
            <Logo size={46} showText={true} textColor={colors.text} subtitle="College Gig Community" />
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 4 }}>Create Account</Text>
            <Text style={{ ...typography.bodyLg, color: colors.textSecondary }}>
              Find part-time gigs or post work near campus
            </Text>
          </View>

          <View style={{ gap: spacing.md }}>
            <Input label="Full name" placeholder="Alex Johnson" value={form.name} onChangeText={set('name')} error={errors.name} autoComplete="name" />
            <Input label="Email" placeholder="you@example.com" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
            <Input label="Phone (optional)" placeholder="+91 98765 43210" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
            <Input
              label="Password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChangeText={set('password')}
              secureTextEntry={!showPw}
              error={errors.password}
              rightIcon={<TouchableOpacity onPress={() => setShowPw(v => !v)}><Text style={{ color: colors.primary, fontSize: 13 }}>{showPw ? 'Hide' : 'Show'}</Text></TouchableOpacity>}
            />
            <Input label="Confirm password" placeholder="Re-enter password" value={form.confirm} onChangeText={set('confirm')} secureTextEntry={!showPw} error={errors.confirm} />

            <Text style={{ ...typography.bodySm, color: colors.textSecondary }}>
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </Text>

            <Button label="Create Account" onPress={handleRegister} loading={loading} fullWidth size="lg" />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
            <Text style={{ ...typography.bodyMd, color: colors.textSecondary }}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={{ ...typography.bodyMd, color: colors.primary, fontWeight: '600' }}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
