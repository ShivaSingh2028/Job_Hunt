import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Keyboard,
  Platform,
  Animated,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../ui/Logo';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';
import { Banner } from '../ui/Banner';
import { Card } from '../ui/Card';
import { KeyboardScreen } from '../ui/KeyboardScreen';

const LAST_EMAIL_KEY = 'JOBHUNT_LAST_EMAIL';
const INTRO_FLAG_KEY = 'JOBHUNT_INTRO_SEEN_V1';

interface Props {
  initialTab?: 'login' | 'register';
}

const INTRO_SLIDES = [
  {
    icon: 'location-outline' as const,
    title: 'Jobs within 5 km',
    desc: 'Find flexible, student-friendly gigs right across your campus perimeter.',
    color: '#7C3AED',
  },
  {
    icon: 'flash-outline' as const,
    title: 'Accept instantly',
    desc: 'One-tap commitments with transparent fixed or hourly pay upon completion.',
    color: '#F59E0B',
  },
  {
    icon: 'repeat-outline' as const,
    title: 'One account, two roles',
    desc: 'Earn as a Seeker or dispatch tasks as a Recruiter with instant mode switching.',
    color: '#2563EB',
  },
];

export function UnifiedAuthScreen({ initialTab = 'login' }: Props) {
  const router = useRouter();
  const { colors, typography, spacing, radii, isDark } = useTheme();
  const { login, signup, resendVerification } = useAuth();

  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [bannerError, setBannerError] = useState<{ variant: 'danger' | 'warning'; message: string } | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

  // Input refs for returnKeyType navigation
  const loginPasswordRef = useRef<any>(null);
  const registerEmailRef = useRef<any>(null);
  const registerPhoneRef = useRef<any>(null);
  const registerPasswordRef = useRef<any>(null);

  // Animations
  const brandAnim = useRef(new Animated.Value(1)).current; // 1 = visible, 0 = collapsed on keyboard
  const tabSlide = useRef(new Animated.Value(initialTab === 'login' ? 0 : 1)).current;
  const formFade = useRef(new Animated.Value(1)).current;

  // Intro Slides Modal
  const [showIntro, setShowIntro] = useState(false);
  const [introIndex, setIntroIndex] = useState(0);

  // Load last saved email & check intro flag
  useEffect(() => {
    AsyncStorage.getItem(LAST_EMAIL_KEY).then((email) => {
      if (email) {
        setLoginEmail(email);
        setRegisterEmail(email);
      }
    }).catch(() => {});

    AsyncStorage.getItem(INTRO_FLAG_KEY).then((val) => {
      if (!val) {
        setShowIntro(true);
      }
    }).catch(() => {});
  }, []);

  // Keyboard collapse listener for brand area
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      Animated.timing(brandAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.timing(brandAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [brandAnim]);

  // Tab change handler with animated transition
  const handleTabChange = (newTab: 'login' | 'register') => {
    if (newTab === tab || loading) return;
    setBannerError(null);

    // Fade out form
    Animated.timing(formFade, {
      toValue: 0,
      duration: 90,
      useNativeDriver: true,
    }).start(() => {
      setTab(newTab);
      // Animate tab indicator
      Animated.timing(tabSlide, {
        toValue: newTab === 'login' ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
      }).start();

      // Fade in form
      Animated.timing(formFade, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleDismissIntro = () => {
    setShowIntro(false);
    AsyncStorage.setItem(INTRO_FLAG_KEY, 'true').catch(() => {});
  };

  // Inline Validation on Blur: Login
  const handleBlurLoginEmail = () => {
    if (!loginEmail.trim()) {
      setLoginErrors((e) => ({ ...e, email: 'Email address is required' }));
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) {
      setLoginErrors((e) => ({ ...e, email: 'Please enter a valid email address' }));
    } else {
      setLoginErrors((e) => ({ ...e, email: '' }));
    }
  };

  const handleBlurLoginPassword = () => {
    if (!loginPassword) {
      setLoginErrors((e) => ({ ...e, password: 'Password is required' }));
    } else {
      setLoginErrors((e) => ({ ...e, password: '' }));
    }
  };

  // Inline Validation on Blur: Register
  const handleBlurRegisterName = () => {
    if (!registerName.trim()) {
      setRegisterErrors((e) => ({ ...e, name: 'Full name is required' }));
    } else {
      setRegisterErrors((e) => ({ ...e, name: '' }));
    }
  };

  const handleBlurRegisterEmail = () => {
    if (!registerEmail.trim()) {
      setRegisterErrors((e) => ({ ...e, email: 'Email address is required' }));
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail.trim())) {
      setRegisterErrors((e) => ({ ...e, email: 'Please enter a valid email address' }));
    } else {
      setRegisterErrors((e) => ({ ...e, email: '' }));
    }
  };

  const handleBlurRegisterPassword = () => {
    if (!registerPassword) {
      setRegisterErrors((e) => ({ ...e, password: 'Password is required' }));
    } else if (registerPassword.length < 8) {
      setRegisterErrors((e) => ({ ...e, password: 'Password must be at least 8 characters' }));
    } else {
      setRegisterErrors((e) => ({ ...e, password: '' }));
    }
  };

  // Submit Login
  const handleSubmitLogin = async () => {
    if (loading) return;
    setBannerError(null);

    const emailErr = !loginEmail.trim()
      ? 'Email is required'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())
      ? 'Please enter a valid email address'
      : '';
    const passErr = !loginPassword ? 'Password is required' : '';

    if (emailErr || passErr) {
      setLoginErrors({ email: emailErr, password: passErr });
      return;
    }

    setLoading(true);
    const normalizedEmail = loginEmail.trim().toLowerCase();

    try {
      await login(normalizedEmail, loginPassword);
      // Remember email
      AsyncStorage.setItem(LAST_EMAIL_KEY, normalizedEmail).catch(() => {});
      router.replace('/(app)');
    } catch (err: any) {
      const code = err?.code;
      if (code === 'EMAIL_NOT_VERIFIED') {
        try {
          await resendVerification(normalizedEmail);
        } catch {}
        router.push({
          pathname: '/(auth)/verify-otp',
          params: { email: normalizedEmail, next: '/(app)', autoSent: 'true' },
        } as any);
      } else if (code === 'UNAUTHORIZED') {
        setLoginErrors({ password: 'Incorrect password. Please try again.' });
      } else if (code === 'NOT_FOUND' && !err?.message?.toLowerCase().includes('endpoint')) {
        setLoginErrors({ email: 'No account found for this email address.' });
      } else if (code === 'USER_BLOCKED') {
        setBannerError({
          variant: 'danger',
          message: err.message || 'Your account is temporarily restricted.',
        });
      } else if (
        err?.status === 429 ||
        code === 'TOO_MANY_REQUESTS' ||
        code === 'TOO_MANY_ATTEMPTS' ||
        code === 'RESEND_TOO_SOON'
      ) {
        setBannerError({
          variant: 'warning',
          message:
            err?.message ||
            'Too many attempts. Please wait a few moments before trying again.',
        });
      } else if (
        err?.status === 503 ||
        code === 'EMAIL_SEND_FAILED' ||
        code === 'DATABASE_UNAVAILABLE'
      ) {
        setBannerError({
          variant: 'danger',
          message:
            err?.message ||
            'Service is temporarily unavailable. Please retry in a moment.',
        });
      } else if (code === 'NETWORK_ERROR') {
        setBannerError({
          variant: 'warning',
          message: "Can't reach the server. Please check your connection and retry.",
        });
      } else {
        setBannerError({
          variant: 'danger',
          message: err?.message || 'Login failed. Please check your credentials.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit Sign Up
  const handleSubmitRegister = async () => {
    if (loading) return;
    setBannerError(null);

    const nameErr = !registerName.trim() ? 'Full name is required' : '';
    const emailErr = !registerEmail.trim()
      ? 'Email is required'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail.trim())
      ? 'Please enter a valid email address'
      : '';
    const passErr = !registerPassword
      ? 'Password is required'
      : registerPassword.length < 8
      ? 'Password must be at least 8 characters'
      : '';

    if (nameErr || emailErr || passErr) {
      setRegisterErrors({ name: nameErr, email: emailErr, password: passErr });
      return;
    }

    setLoading(true);
    const normalizedEmail = registerEmail.trim().toLowerCase();

    try {
      await signup(
        registerName.trim(),
        normalizedEmail,
        registerPassword,
        registerPhone.trim() || undefined
      );
      // Remember email
      AsyncStorage.setItem(LAST_EMAIL_KEY, normalizedEmail).catch(() => {});
      router.replace({
        pathname: '/(auth)/verify-otp',
        params: { email: normalizedEmail, next: '/(app)', autoSent: 'true' },
      } as any);
    } catch (err: any) {
      if (err?.code === 'EMAIL_ALREADY_REGISTERED' || err?.code === 'CONFLICT') {
        setRegisterErrors({ email: 'This email is already registered. Please log in.' });
      } else if (err?.status === 429) {
        setBannerError({
          variant: 'warning',
          message: 'Too many registration requests. Please wait a moment.',
        });
      } else if (err?.status === 503) {
        setBannerError({
          variant: 'danger',
          message: 'Account service temporarily unavailable. Please retry shortly.',
        });
      } else {
        setBannerError({
          variant: 'danger',
          message: err?.message || 'Could not complete registration. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const brandHeight = brandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 140],
  });

  const brandOpacity = brandAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <KeyboardScreen contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' }}>
      {/* Optional First-Launch Intro Modal */}
      <Modal visible={showIntro} transparent animationType="fade" onRequestClose={handleDismissIntro}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', padding: spacing.lg }}>
          <Card variant="elevated" style={{ padding: spacing.xl, gap: spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {INTRO_SLIDES.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: i === introIndex ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: i === introIndex ? colors.primary : colors.borderSubtle,
                    }}
                  />
                ))}
              </View>
              <TouchableOpacity onPress={handleDismissIntro} accessibilityRole="button" accessibilityLabel="Skip onboarding intro">
                <Text style={{ ...typography.caption, color: colors.textSecondary, fontWeight: '700' }}>Skip</Text>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: `${INTRO_SLIDES[introIndex].color}18`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={INTRO_SLIDES[introIndex].icon}
                  size={32}
                  color={INTRO_SLIDES[introIndex].color}
                />
              </View>

              <Text style={{ ...typography.title, fontSize: 20, textAlign: 'center', fontWeight: '700', color: colors.text }}>
                {INTRO_SLIDES[introIndex].title}
              </Text>

              <Text style={{ ...typography.body, fontSize: 14, textAlign: 'center', color: colors.textSecondary, lineHeight: 20 }}>
                {INTRO_SLIDES[introIndex].desc}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {introIndex < INTRO_SLIDES.length - 1 ? (
                <Button
                  label="Next"
                  variant="primary"
                  fullWidth
                  onPress={() => setIntroIndex(introIndex + 1)}
                />
              ) : (
                <Button
                  label="Get Started"
                  variant="primary"
                  fullWidth
                  onPress={handleDismissIntro}
                />
              )}
            </View>
          </Card>
        </View>
      </Modal>

      {/* Brand Header Area (Fades & collapses smoothly on keyboard open) */}
      <Animated.View
        style={{
          height: brandHeight,
          opacity: brandOpacity,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          overflow: 'hidden',
          marginBottom: spacing.md,
        }}
      >
        <Logo size={48} />
        <Text style={{ ...typography.title, fontSize: 26, fontWeight: '800', color: colors.text }}>
          JobHunt
        </Text>
        <Text style={{ ...typography.secondary, color: colors.textSecondary, textAlign: 'center' }}>
          Find gigs near campus. Post gigs in minutes.
        </Text>
      </Animated.View>

      {/* Main Auth Card */}
      <Card variant="elevated" style={{ padding: spacing.lg, gap: spacing.md }}>
        {/* Animated Segmented Control: Log in | Sign up */}
        <View
          style={{
            height: 46,
            flexDirection: 'row',
            backgroundColor: colors.surfaceSecondary,
            borderRadius: radii.md,
            padding: 3,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            position: 'relative',
            alignItems: 'center',
          }}
          accessibilityRole="radiogroup"
          accessibilityLabel="Authentication tabs: Log in or Sign up"
        >
          {/* Active Tab Sliding Pill */}
          <Animated.View
            style={{
              position: 'absolute',
              left: 3,
              top: 3,
              width: '49%',
              height: 38,
              backgroundColor: colors.surface,
              borderRadius: radii.md - 2,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 1.5 },
              shadowOpacity: isDark ? 0.35 : 0.08,
              shadowRadius: 3,
              elevation: 2,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              transform: [
                {
                  translateX: tabSlide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 150], // Approximate segment width; flex-based children handle content
                  }),
                },
              ],
            }}
          />

          <TouchableOpacity
            onPress={() => handleTabChange('login')}
            disabled={loading}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ selected: tab === 'login' }}
            style={{
              flex: 1,
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <Text
              style={{
                ...typography.body,
                fontSize: 14,
                fontWeight: tab === 'login' ? '700' : '500',
                color: tab === 'login' ? colors.primary : colors.textSecondary,
              }}
            >
              Log in
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTabChange('register')}
            disabled={loading}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ selected: tab === 'register' }}
            style={{
              flex: 1,
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <Text
              style={{
                ...typography.body,
                fontSize: 14,
                fontWeight: tab === 'register' ? '700' : '500',
                color: tab === 'register' ? colors.primary : colors.textSecondary,
              }}
            >
              Sign up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Global Banner Notification for Server & Network errors */}
        {bannerError && (
          <Banner
            variant={bannerError.variant}
            message={bannerError.message}
            onDismiss={() => setBannerError(null)}
          />
        )}

        {/* Dynamic Form Area with 200ms Transition */}
        <Animated.View style={{ opacity: formFade, gap: spacing.md }}>
          {tab === 'login' ? (
            /* Log in Form */
            <View style={{ gap: spacing.md }}>
              <TextField
                label="Email address"
                placeholder="student@college.edu"
                value={loginEmail}
                onChangeText={(text) => {
                  setLoginEmail(text);
                  if (loginErrors.email) setLoginErrors((e) => ({ ...e, email: '' }));
                }}
                onBlur={handleBlurLoginEmail}
                error={loginErrors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => loginPasswordRef.current?.focus()}
                leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textSecondary} />}
              />

              <View style={{ gap: 4 }}>
                <TextField
                  ref={loginPasswordRef}
                  label="Password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChangeText={(text) => {
                    setLoginPassword(text);
                    if (loginErrors.password) setLoginErrors((e) => ({ ...e, password: '' }));
                  }}
                  onBlur={handleBlurLoginPassword}
                  error={loginErrors.password}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmitLogin}
                  leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />}
                />

                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  style={{ alignSelf: 'flex-end', paddingVertical: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel="Forgot password recovery"
                >
                  <Text style={{ ...typography.caption, color: colors.primary, fontWeight: '600' }}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                label="Log in"
                onPress={handleSubmitLogin}
                loading={loading}
                variant="primary"
                size="lg"
                fullWidth
              />
            </View>
          ) : (
            /* Sign up Form */
            <View style={{ gap: spacing.md }}>
              <TextField
                label="Full name"
                placeholder="e.g. Alex Johnson"
                value={registerName}
                onChangeText={(text) => {
                  setRegisterName(text);
                  if (registerErrors.name) setRegisterErrors((e) => ({ ...e, name: '' }));
                }}
                onBlur={handleBlurRegisterName}
                error={registerErrors.name}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                onSubmitEditing={() => registerEmailRef.current?.focus()}
                leftIcon={<Ionicons name="person-outline" size={18} color={colors.textSecondary} />}
              />

              <TextField
                ref={registerEmailRef}
                label="Student email"
                placeholder="student@college.edu"
                value={registerEmail}
                onChangeText={(text) => {
                  setRegisterEmail(text);
                  if (registerErrors.email) setRegisterErrors((e) => ({ ...e, email: '' }));
                }}
                onBlur={handleBlurRegisterEmail}
                error={registerErrors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => registerPhoneRef.current?.focus()}
                leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textSecondary} />}
              />

              <TextField
                ref={registerPhoneRef}
                label="Phone number (optional)"
                placeholder="e.g. 9876543210"
                value={registerPhone}
                onChangeText={setRegisterPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                returnKeyType="next"
                onSubmitEditing={() => registerPasswordRef.current?.focus()}
                leftIcon={<Ionicons name="call-outline" size={18} color={colors.textSecondary} />}
              />

              <TextField
                ref={registerPasswordRef}
                label="Create password"
                placeholder="Minimum 8 characters"
                value={registerPassword}
                onChangeText={(text) => {
                  setRegisterPassword(text);
                  if (registerErrors.password) setRegisterErrors((e) => ({ ...e, password: '' }));
                }}
                onBlur={handleBlurRegisterPassword}
                error={registerErrors.password}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                helperText="Must be at least 8 characters with letters & numbers."
                returnKeyType="done"
                onSubmitEditing={handleSubmitRegister}
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />}
              />

              <Button
                label="Create account"
                onPress={handleSubmitRegister}
                loading={loading}
                variant="primary"
                size="lg"
                fullWidth
              />

              <Text style={{ ...typography.caption, color: colors.textSecondary, textAlign: 'center', lineHeight: 16 }}>
                By continuing you agree to JobHunt's Terms & Privacy Policy.
              </Text>
            </View>
          )}
        </Animated.View>
      </Card>
    </KeyboardScreen>
  );
}
