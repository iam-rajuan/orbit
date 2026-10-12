import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';

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
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrapper,
          error ? styles.inputWrapperError : null,
        ]}
      >
        <TextInput
          multiline
          numberOfLines={numberOfLines}
          textAlignVertical="top"
          placeholderTextColor="#A1A1AA"
          style={[styles.input, style]}
          {...props}
        />
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
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
    color: '#3F3F46',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  inputWrapper: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 84,
  },
  inputWrapperError: {
    borderColor: '#F43F5E',
    backgroundColor: '#FFF1F2',
  },
  input: {
    fontSize: 14,
    color: '#18181B',
    minHeight: 68,
    outlineStyle: 'none' as any,
  },
  errorText: {
    fontSize: 12,
    color: '#F43F5E',
    marginTop: 4,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 4,
  },
});
