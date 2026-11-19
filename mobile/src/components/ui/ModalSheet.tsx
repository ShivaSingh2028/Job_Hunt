import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export interface ModalSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ModalSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  style,
}: ModalSheetProps) {
  const { colors, radii, typography, spacing } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              justifyContent: 'flex-end',
            }}
          >
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  {
                    backgroundColor: colors.surface,
                    borderTopLeftRadius: radii.xl,
                    borderTopRightRadius: radii.xl,
                    paddingHorizontal: spacing.screenHorizontal,
                    paddingBottom: spacing.xxl,
                    paddingTop: spacing.sm,
                    borderTopWidth: 1,
                    borderColor: colors.border,
                    maxHeight: '85%',
                  },
                  style,
                ]}
              >
                {/* Drag handle */}
                <View
                  style={{
                    width: 36,
                    height: 4,
                    backgroundColor: colors.border,
                    borderRadius: radii.full,
                    alignSelf: 'center',
                    marginBottom: spacing.md,
                  }}
                />

                {/* Header row */}
                {(title || subtitle) && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: spacing.md,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      {title ? (
                        <Text
                          style={{
                            ...typography.title,
                            fontSize: 18,
                            lineHeight: 24,
                            color: colors.text,
                            fontWeight: '600',
                          }}
                        >
                          {title}
                        </Text>
                      ) : null}
                      {subtitle ? (
                        <Text
                          style={{
                            ...typography.caption,
                            color: colors.textSecondary,
                            marginTop: 2,
                          }}
                        >
                          {subtitle}
                        </Text>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      onPress={onClose}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: radii.full,
                        backgroundColor: colors.bgTertiary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Close sheet"
                    >
                      <Ionicons name="close" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                )}

                {children}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const BottomSheet = ModalSheet;
