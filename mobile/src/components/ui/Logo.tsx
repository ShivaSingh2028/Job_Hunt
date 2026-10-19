import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';

interface LogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function Logo({ size = 48, showText = false, textColor = '#fff', subtitle, style }: LogoProps) {
  const radius = Math.round(size * 0.22);
  return (
    <View style={[styles.container, style]}>
      <View style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: '#0d041f',
      }}>
        <Image
          source={require('../../../assets/logo.png')}
          style={{
            width: size,
            height: size,
          }}
          resizeMode="cover"
        />
      </View>
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.brandText, { color: textColor, fontSize: Math.round(size * 0.52) }]}>
            Job<Text style={styles.brandAccent}>Hunt</Text>
          </Text>
          {subtitle && (
            <Text style={[styles.subText, { color: textColor, opacity: 0.75, fontSize: Math.round(size * 0.24) }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    justifyContent: 'center',
  },
  brandText: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: '#fbbf24',
  },
  subText: {
    fontWeight: '500',
    marginTop: 1,
  },
});
