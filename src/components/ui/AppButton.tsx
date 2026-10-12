import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleSheet,
  View,
} from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  title?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  children,
}) => {
  const isInteractive = !disabled && !loading;

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
          text: { color: '#ffffff', fontWeight: '600' },
        };
      case 'secondary':
        return {
          container: { backgroundColor: '#F4F4F5', borderColor: '#F4F4F5' },
          text: { color: '#3F3F46', fontWeight: '600' },
        };
      case 'outline':
        return {
          container: { backgroundColor: 'transparent', borderColor: '#E4E4E7', borderWidth: 1.5 },
          text: { color: '#52525B', fontWeight: '600' },
        };
      case 'danger':
        return {
          container: { backgroundColor: '#F43F5E', borderColor: '#F43F5E' },
          text: { color: '#ffffff', fontWeight: '600' },
        };
      case 'success':
        return {
          container: { backgroundColor: '#10B981', borderColor: '#10B981' },
          text: { color: '#ffffff', fontWeight: '600' },
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent', borderColor: 'transparent' },
          text: { color: '#4F46E5', fontWeight: '600' },
        };
      default:
        return {
          container: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
          text: { color: '#ffffff', fontWeight: '600' },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 10 },
          text: { fontSize: 13 },
        };
      case 'lg':
        return {
          container: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14 },
          text: { fontSize: 16 },
        };
      case 'md':
      default:
        return {
          container: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
          text: { fontSize: 14 },
        };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      style={[
        styles.base,
        vStyles.container,
        sStyles.container,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={vStyles.text.color}
          style={{ marginRight: title || children ? 8 : 0 }}
        />
      ) : icon && iconPosition === 'left' ? (
        <View style={styles.iconLeft}>{icon}</View>
      ) : null}

      {children ? (
        children
      ) : title ? (
        <Text style={[styles.textBase, vStyles.text, sStyles.text, textStyle]}>
          {title}
        </Text>
      ) : null}

      {!loading && icon && iconPosition === 'right' && (
        <View style={styles.iconRight}>{icon}</View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  textBase: {
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  disabled: {
    opacity: 0.4,
    cursor: 'not-allowed' as any,
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
});
