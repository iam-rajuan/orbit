import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';

interface AppCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label?: string;
  size?: number;
  disabled?: boolean;
  style?: ViewStyle;
}

export const AppCheckbox: React.FC<AppCheckboxProps> = ({
  checked,
  onToggle,
  label,
  size = 20,
  disabled = false,
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={disabled ? undefined : onToggle}
      disabled={disabled}
      style={[styles.container, style]}
    >
      <View
        style={[
          styles.box,
          {
            width: size,
            height: size,
            borderRadius: size * 0.3,
          },
          checked ? styles.boxChecked : styles.boxUnchecked,
          disabled ? styles.boxDisabled : null,
        ]}
      >
        {checked && <Check size={size - 6} color="#ffffff" strokeWidth={3} />}
      </View>
      {label ? (
        <Text style={[styles.label, checked && styles.labelChecked]}>
          {label}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  boxUnchecked: {
    borderColor: '#D4D4D8',
    backgroundColor: '#FAFAFA',
  },
  boxChecked: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  boxDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed' as any,
  },
  label: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
    color: '#18181B',
  },
  labelChecked: {
    color: '#71717A',
  },
});
