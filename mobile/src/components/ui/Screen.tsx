import { View, ScrollView, ViewStyle, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  keyboardAware?: boolean;
}

export function Screen({
  children,
  scroll = false,
  style,
  contentStyle,
  edges = ['top', 'bottom'],
  keyboardAware = false,
}: ScreenProps) {
  const { colors, isDark } = useTheme();

  const content = scroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[{ flexGrow: 1 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
  );

  const inner = keyboardAware ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      {content}
    </KeyboardAvoidingView>
  ) : content;

  return (
    <SafeAreaView
      edges={edges}
      style={[
        { flex: 1, backgroundColor: colors.bg },
        style,
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {inner}
    </SafeAreaView>
  );
}
