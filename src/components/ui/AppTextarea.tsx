import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface AppTextareaProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
}

export const AppTextarea: React.FC<AppTextareaProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  style,
  numberOfLines = 3,
  ...props
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.surfaceSubtle,
            borderColor: error ? theme.danger : theme.border,
          },
          error ? { backgroundColor: theme.dangerBg } : null,
        ]}
      >
        <TextInput
          multiline
          numberOfLines={numberOfLines}
          textAlignVertical="top"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.textPrimary }, style]}
          {...props}
        />
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: theme.textMuted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 84,
  },
  input: {
    fontSize: 14,
    minHeight: 68,
    outlineStyle: 'none' as any,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});
