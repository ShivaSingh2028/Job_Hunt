import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '../../src/components/ui/Logo';

const { width, height } = Dimensions.get('window');

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
  { icon: 'location-outline', title: 'Verified Local Gigs', desc: 'Explore vetted tasks within 5 km campus radius' },
  { icon: 'flash-outline', title: 'Direct Acceptance', desc: 'Claim listings instantly with transparent upfront pay' },
  { icon: 'repeat-outline', title: 'Unified Dual Role', desc: 'Seamlessly find work or post gigs in one account' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#4c1d95', '#7c3aed', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles */}
      <View style={[styles.circle, { top: -60, right: -60, opacity: 0.15 }]} />
      <View style={[styles.circle, { bottom: height * 0.3, left: -80, width: 200, height: 200, opacity: 0.10 }]} />

      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Main Brand Logo */}
          <Logo size={96} style={styles.logoWrap} />
          <Text style={styles.appName}>JobHunt</Text>
          <Text style={styles.tagline}>Your campus. Your opportunities.</Text>
        </Animated.View>

        {/* Feature pills */}
        <Animated.View style={[styles.features, { opacity: fadeAnim }]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featurePill}>
              <View style={styles.iconContainer}>
                <Ionicons name={f.icon} size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* CTA buttons */}
        <Animated.View style={[styles.cta, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Get Started — Free Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Sign In to Account</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Enterprise-grade campus opportunity network
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 24 },
  circle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#fff',
  },
  header: { marginTop: 40, alignItems: 'center' },
  logoWrap: {
    marginBottom: 16,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  features: {
    marginTop: 36,
    gap: 12,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  featureDesc: { fontSize: 13, color: 'rgba(255,255,255,0.80)', marginTop: 2 },
  cta: { position: 'absolute', bottom: 40, left: 24, right: 24, gap: 12 },
  primaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#7c3aed', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  secondaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disclaimer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.60)',
    fontSize: 12,
    marginTop: 4,
  },
});
