import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { PRIORITY_COLORS, CATEGORY_COLORS, EXPENSE_TYPE_COLORS } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

interface AppBadgeProps {
  label: string;
  variant?: 'priority' | 'category' | 'expenseType' | 'default';
  priority?: 'High' | 'Medium' | 'Low';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  label,
  variant = 'default',
  priority,
  size = 'md',
  style,
  textStyle,
}) => {
  const { isDark } = useTheme();

  let bg = isDark ? 'rgba(255,255,255,0.06)' : '#F4F4F5';
  let textColor = isDark ? '#A1A1AA' : '#52525B';
  let border = isDark ? 'rgba(255,255,255,0.1)' : 'transparent';

  if (variant === 'priority' && priority) {
    const pStyle = PRIORITY_COLORS[priority];
    if (pStyle) {
      bg = isDark ? pStyle.darkBg : pStyle.bg;
      textColor = isDark ? pStyle.darkText : pStyle.text;
      border = isDark ? pStyle.darkBorder : 'transparent';
    }
  } else if (variant === 'expenseType') {
    const eStyle = EXPENSE_TYPE_COLORS[label as 'Need' | 'Want'];
    if (eStyle) {
      bg = isDark
        ? label === 'Need'
          ? 'rgba(16,185,129,0.18)'
          : 'rgba(124,58,237,0.18)'
        : eStyle.bg;
      textColor = isDark
        ? label === 'Need'
          ? '#34D399'
          : '#A78BFA'
        : eStyle.text;
      border = isDark
        ? label === 'Need'
          ? 'rgba(16,185,129,0.3)'
          : 'rgba(124,58,237,0.3)'
        : 'transparent';
    }
  } else if (variant === 'category') {
    const cStyle = CATEGORY_COLORS[label];
    if (cStyle) {
      bg = isDark ? 'rgba(255,255,255,0.08)' : cStyle.bg;
      textColor = isDark ? '#E4E4E7' : cStyle.text;
      border = isDark ? 'rgba(255,255,255,0.12)' : 'transparent';
    }
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: border !== 'transparent' ? 1 : 0,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 10,
          borderRadius: 100,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: isSmall ? 11 : 12,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
